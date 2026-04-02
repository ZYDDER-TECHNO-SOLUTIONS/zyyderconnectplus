from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from app.config import settings

security = HTTPBearer()


class CurrentUser:
    def __init__(self, user_id: str, email: str, role: str):
        self.id = user_id
        self.email = email
        self.role = role


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    token = credentials.credentials
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{settings.AUTH_SERVICE_URL}/auth/verify", params={"token": token}, timeout=5.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            data = resp.json()
            return CurrentUser(user_id=data["user_id"], email=data["email"], role=data["role"])
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth service unavailable")
