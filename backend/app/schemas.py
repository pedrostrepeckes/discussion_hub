from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .db.models import Role, ResponseType, ApprovalStatus, DiscussionStatus
import enum

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    role: Role

    class Config:
        orm_mode = True

# Discussion Schemas
class DiscussionBase(BaseModel):
    title: str
    content: str

class DiscussionCreate(DiscussionBase):
    pass

class DiscussionOut(DiscussionBase):
    id: int
    status: DiscussionStatus
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Response Schemas
class ResponseBase(BaseModel):
    content: str
    type: ResponseType
    parent_id: Optional[int] = None

class ResponseCreate(ResponseBase):
    pass

class VoteType(str, enum.Enum):
    up = "up"
    down = "down"

class ResponseOut(ResponseBase):
    id: int
    discussion_id: int
    user_id: int
    status_aprovacao: ApprovalStatus
    is_reliable_source: bool
    upvotes: int
    downvotes: int
    created_at: datetime
    author: UserOut
    user_vote: Optional[VoteType] = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
