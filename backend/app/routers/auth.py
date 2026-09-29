from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from ..models.user import User
from ..models.case import Case
from ..schemas import UserCreate, UserResponse, Token, UserProfileUpdate
from ..middleware.auth import get_password_hash, verify_password, create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        full_name=user.full_name,
        age=user.age,
        gender=user.gender,
        phone=user.phone,
        emergency_contact=user.emergency_contact,
        bio=user.bio
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If new user is a victim, automatically initialize their case file
    if new_user.role == "victim":
        # Find default counsellor (first available counsellor or user id 1)
        counsellor = db.query(User).filter(User.role == "counsellor").first()
        c_id = counsellor.id if counsellor else 1
        new_case = Case(
            victim_id=new_user.id,
            status="active",
            risk_level="low",
            assigned_counsellor_id=c_id
        )
        db.add(new_case)
        db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=UserResponse)
@router.put("/profile", response_model=UserResponse)
def update_profile(profile_data: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.age is not None:
        current_user.age = profile_data.age
    if profile_data.gender is not None:
        current_user.gender = profile_data.gender
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.emergency_contact is not None:
        current_user.emergency_contact = profile_data.emergency_contact
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    db.commit()
    db.refresh(current_user)
    return current_user
