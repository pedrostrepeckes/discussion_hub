from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
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
            raise HTTPException(status_code=400, detail="Nesting limit reached (max 1 level).")

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
def read_responses(discussion_id: int, db: Session = Depends(database.get_db)):
    # Only return approved responses for public view
    responses = db.query(models.Response).filter(
        models.Response.discussion_id == discussion_id,
        models.Response.status_aprovacao == models.ApprovalStatus.aprovada
    ).all()
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

@router.post("/responses/{response_id}/upvote")
def upvote_response(response_id: int, db: Session = Depends(database.get_db)):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
    
    response.upvotes += 1
    db.commit()
    db.refresh(response)
    return {"message": "Upvote registered", "upvotes": response.upvotes}

@router.post("/responses/{response_id}/downvote")
def downvote_response(response_id: int, db: Session = Depends(database.get_db)):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail=texts.ERROR_RESPONSE_NOT_FOUND)
    
    response.downvotes += 1
    db.commit()
    db.refresh(response)
    return {"message": "Downvote registered", "downvotes": response.downvotes}
