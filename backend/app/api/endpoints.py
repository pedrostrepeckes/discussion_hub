from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import database, models
from .. import schemas
from . import auth
from ..core import texts

router = APIRouter()

# Auth Endpoints
@router.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail=texts.ERROR_EMAIL_ALREADY_EXISTS)
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, name=user.name, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not auth.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail=texts.ERROR_INCORRECT_PASSWORD)
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# Discussion Endpoints
@router.post("/discussions/", response_model=schemas.DiscussionOut)
def create_discussion(discussion: schemas.DiscussionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_admin)):
    new_discussion = models.Discussion(**discussion.dict(), user_id=current_user.id)
    db.add(new_discussion)
    db.commit()
    db.refresh(new_discussion)
    return new_discussion

@router.get("/discussions/", response_model=List[schemas.DiscussionOut])
def read_discussions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    discussions = db.query(models.Discussion).offset(skip).limit(limit).all()
    return discussions

@router.get("/discussions/{discussion_id}", response_model=schemas.DiscussionOut)
def read_discussion(discussion_id: int, db: Session = Depends(database.get_db)):
    discussion = db.query(models.Discussion).filter(models.Discussion.id == discussion_id).first()
    if discussion is None:
        raise HTTPException(status_code=404, detail=texts.ERROR_DISCUSSION_NOT_FOUND)
    return discussion

@router.put("/discussions/{discussion_id}/finish", response_model=schemas.DiscussionOut)
def finish_discussion(discussion_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_moderator)):
    discussion = db.query(models.Discussion).filter(models.Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail=texts.ERROR_DISCUSSION_NOT_FOUND)
    
    discussion.status = models.DiscussionStatus.finalizada
    db.commit()
    db.refresh(discussion)
    return discussion

# Response Endpoints
@router.post("/discussions/{discussion_id}/responses/", response_model=schemas.ResponseOut)
def create_response(discussion_id: int, response: schemas.ResponseCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check if discussion exists
    discussion = db.query(models.Discussion).filter(models.Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail=texts.ERROR_DISCUSSION_NOT_FOUND)
    
    # Check nesting level
    if response.parent_id:
        parent = db.query(models.Response).filter(models.Response.id == response.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
        if parent.parent_id: # Parent already has a parent, so this would be level 2 (too deep)
            raise HTTPException(status_code=400, detail=texts.ERROR_NESTING_LIMIT)
        
        # Check if user already replied to this parent
        existing_response = db.query(models.Response).filter(
            models.Response.parent_id == response.parent_id,
            models.Response.user_id == current_user.id
        ).first()
        if existing_response:
            raise HTTPException(status_code=400, detail=texts.ERROR_ALREADY_RESPONDED)

    new_response = models.Response(
        **response.dict(),
        discussion_id=discussion_id,
        user_id=current_user.id,
        status_aprovacao=models.ApprovalStatus.pendente
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    return new_response

@router.get("/discussions/{discussion_id}/responses/", response_model=List[schemas.ResponseOut])
def read_responses(discussion_id: int, db: Session = Depends(database.get_db), current_user: Optional[models.User] = Depends(auth.get_current_user_optional)):
    # Only return approved responses for public view
    responses = db.query(models.Response).filter(
        models.Response.discussion_id == discussion_id,
        models.Response.status_aprovacao == models.ApprovalStatus.aprovada
    ).all()
    
    # If user is logged in, fetch their votes
    user_votes = {}
    if current_user:
        votes = db.query(models.Vote).filter(
            models.Vote.user_id == current_user.id,
            models.Vote.response_id.in_([r.id for r in responses])
        ).all()
        user_votes = {v.response_id: v.type for v in votes}

    # Attach user_vote to responses
    for response in responses:
        response.user_vote = user_votes.get(response.id)

    return responses

# Moderation Endpoints
@router.get("/moderation/responses/pending", response_model=List[schemas.ResponseOut])
def read_pending_responses(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_moderator)):
    responses = db.query(models.Response).filter(models.Response.status_aprovacao == models.ApprovalStatus.pendente).all()
    return responses

@router.put("/moderation/responses/{response_id}/approve")
def approve_response(response_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_moderator)):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
    response.status_aprovacao = models.ApprovalStatus.aprovada
    db.commit()
    return {"message": texts.SUCCESS_RESPONSE_APPROVED}

@router.put("/moderation/responses/{response_id}/reject")
def reject_response(response_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_moderator)):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
    response.status_aprovacao = models.ApprovalStatus.rejeitada
    db.commit()
    return {"message": texts.SUCCESS_RESPONSE_REJECTED}

@router.post("/responses/{response_id}/vote")
def vote_response(
    response_id: int, 
    vote_type: schemas.VoteType, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
    
    # Check if user already voted
    existing_vote = db.query(models.Vote).filter(
        models.Vote.user_id == current_user.id,
        models.Vote.response_id == response_id
    ).first()

    if existing_vote:
        if existing_vote.type == vote_type:
            # Same vote: remove it (toggle)
            db.delete(existing_vote)
            if vote_type == schemas.VoteType.up:
                response.upvotes -= 1
            else:
                response.downvotes -= 1
        else:
            # Different vote: change it
            if existing_vote.type == schemas.VoteType.up:
                response.upvotes -= 1
                response.downvotes += 1
            else:
                response.downvotes -= 1
                response.upvotes += 1
            existing_vote.type = vote_type
    else:
        # New vote
        new_vote = models.Vote(user_id=current_user.id, response_id=response_id, type=vote_type)
        db.add(new_vote)
        if vote_type == schemas.VoteType.up:
            response.upvotes += 1
        else:
            response.downvotes += 1
    
    db.commit()
    db.refresh(response)
    
    # Return updated counts and user_vote
    # We need to determine the new user_vote state
    current_vote_state = None
    if existing_vote and existing_vote.type == vote_type: # We just deleted it
         current_vote_state = None
    elif existing_vote: # We changed it
         current_vote_state = vote_type
    else: # We created it
         current_vote_state = vote_type

    # Actually, if we deleted it, existing_vote is still the object but it's marked for deletion. 
    # Logic above:
    # If same vote: delete. user_vote is None.
    # If different: update. user_vote is new type.
    # If new: create. user_vote is new type.
    
    # Let's simplify the return to just match what frontend might need or just success message
    # But frontend expects updated counts.
    
    return {
        "message": texts.SUCCESS_VOTE_REGISTERED, 
        "upvotes": response.upvotes, 
        "downvotes": response.downvotes,
        "user_vote": current_vote_state
    }

