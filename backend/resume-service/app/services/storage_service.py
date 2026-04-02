from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
import io
from app.config import settings

_client = None
_fs = None


def get_gridfs() -> AsyncIOMotorGridFSBucket:
    global _client, _fs
    if _fs is None:
        _client = AsyncIOMotorClient(settings.MONGO_URL)
        db = _client[settings.MONGO_DB]
        _fs = AsyncIOMotorGridFSBucket(db)
    return _fs


async def upload_file(object_name: str, content: bytes, content_type: str) -> str:
    fs = get_gridfs()
    file_id = await fs.upload_from_stream(
        object_name,
        io.BytesIO(content),
        metadata={"content_type": content_type},
    )
    return str(file_id)


async def get_file(file_id: str) -> tuple[bytes, str]:
    fs = get_gridfs()
    stream = await fs.open_download_stream(ObjectId(file_id))
    content = await stream.read()
    content_type = stream.metadata.get("content_type", "application/octet-stream") if stream.metadata else "application/octet-stream"
    return content, content_type


async def delete_file(file_id: str):
    fs = get_gridfs()
    try:
        await fs.delete(ObjectId(file_id))
    except Exception:
        pass
