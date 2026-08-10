#
#  Copyright 2026 The InfiniFlow Authors. All Rights Reserved.
#

from api.db.db_models import DB, OutputRule
from api.db.services.common_service import CommonService


class OutputRuleService(CommonService):
    model = OutputRule

    @classmethod
    @DB.connection_context()
    def list_by_tenant(cls, tenant_id: str, enabled_only: bool = False):
        query = cls.model.select().where(cls.model.tenant_id == tenant_id)
        if enabled_only:
            query = query.where(cls.model.enabled == True)  # noqa: E712
        return list(query.order_by(cls.model.priority.asc(), cls.model.create_time.asc()))
