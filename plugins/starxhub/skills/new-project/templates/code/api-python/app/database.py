"""engine / SessionLocal / get_db。"""
from sqlalchemy import create_engine
#@@TENANT_ONLY_START
from sqlalchemy import event
#@@TENANT_ONLY_END
from sqlalchemy.orm import sessionmaker

from app.config import settings
#@@TENANT_ONLY_START
from app.core.context import get_current_tenant
from app.models.base import TenantMixin
#@@TENANT_ONLY_END

_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)

#@@TENANT_ONLY_START
def _autofill_tenant(session, _ctx, instances):
    for obj in instances:
        if isinstance(obj, TenantMixin) and getattr(obj, "tenant_id", None) is None:
            tenant = get_current_tenant()
            if tenant is not None:
                obj.tenant_id = tenant


event.listen(SessionLocal, "before_flush", _autofill_tenant)
#@@TENANT_ONLY_END


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
