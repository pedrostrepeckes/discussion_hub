from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Enum, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class Role(str, enum.Enum):
    regular = "regular"
    moderator = "moderator"
    admin = "admin"

class ResponseType(str, enum.Enum):
    concordo = "concordo"
    discordo = "discordo"

class ApprovalStatus(str, enum.Enum):
    pendente = "pendente"
    aprovada = "aprovada"
    rejeitada = "rejeitada"

class DiscussionStatus(str, enum.Enum):
    ativa = "ativa"
    finalizada = "finalizada"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(Role), default=Role.regular)

    discussions = relationship("Discussion", back_populates="author")
    responses = relationship("Response", back_populates="author")
    votes = relationship("Vote", back_populates="user")

class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(DiscussionStatus), default=DiscussionStatus.ativa)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", back_populates="discussions")
    responses = relationship("Response", back_populates="discussion")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    type = Column(Enum(ResponseType), nullable=False)
    status_aprovacao = Column(Enum(ApprovalStatus), default=ApprovalStatus.pendente)
    parent_id = Column(Integer, ForeignKey("responses.id"), nullable=True)
    is_reliable_source = Column(Boolean, default=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    discussion = relationship("Discussion", back_populates="responses")
    author = relationship("User", back_populates="responses")
    parent = relationship("Response", remote_side=[id], back_populates="replies")
    replies = relationship("Response", back_populates="parent")
    votes = relationship("Vote", back_populates="response")

class ReliableSource(Base):
    __tablename__ = "reliable_sources"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(255), unique=True, nullable=False)

class VoteType(str, enum.Enum):
    up = "up"
    down = "down"

class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint('user_id', 'response_id', name='unique_user_response_vote'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    type = Column(Enum(VoteType), nullable=False)

    user = relationship("User", back_populates="votes")
    response = relationship("Response", back_populates="votes")

