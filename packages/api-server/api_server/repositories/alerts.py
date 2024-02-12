from datetime import datetime
from typing import List, Optional

from fastapi import Depends

from api_server.authenticator import user_dep
from api_server.logger import logger
from api_server.models import User
from api_server.models import tortoise_models as ttm
from api_server.repositories.tasks import TaskRepository, task_repo_dep


class AlertRepository:
    def __init__(self, user: User, task_repo: Optional[TaskRepository]):
        self.user = user
        self.task_repo = (
            task_repo if task_repo is not None else TaskRepository(self.user)
        )

    async def get_all_alerts(self) -> List[ttm.AlertPydantic]:
        alerts = await ttm.Alert.all()
        return [await ttm.AlertPydantic.from_tortoise_orm(a) for a in alerts]

    async def alert_exists(self, alert_id: str) -> bool:
        result = await ttm.Alert.exists(id=alert_id)
        return result

    async def get_alert(self, alert_id: str) -> Optional[ttm.AlertPydantic]:
        alert = await ttm.Alert.get_or_none(id=alert_id)
        if alert is None:
            logger.error(f"Alert with ID {alert_id} not found")
            return None
        alert_pydantic = await ttm.AlertPydantic.from_tortoise_orm(alert)
        return alert_pydantic

    async def create_alert(
        self, alert_id: str, category: str
    ) -> Optional[ttm.AlertPydantic]:
        alert, _ = await ttm.Alert.update_or_create(
            {
                "original_id": alert_id,
                "category": category,
                "unix_millis_created_time": round(datetime.now().timestamp() * 1e3),
                "acknowledged_by": None,
                "unix_millis_acknowledged_time": None,
            },
            id=alert_id,
        )
        if alert is None:
            logger.error(f"Failed to create Alert with ID {alert_id}")
            return None
        alert_pydantic = await ttm.AlertPydantic.from_tortoise_orm(alert)
        return alert_pydantic

    async def acknowledge_alert(self, alert_id: str) -> Optional[ttm.AlertPydantic]:
        alert = await ttm.Alert.get_or_none(id=alert_id)
        if alert is None:
            # If there's no alert in the database, create a new one
            ack_time = datetime.now()
            epoch = datetime.utcfromtimestamp(0)
            ack_unix_millis = round((ack_time - epoch).total_seconds() * 1000)
            new_id = f"{alert_id}__{ack_unix_millis}"

            alert = ttm.Alert(id=new_id)
            alert._custom_generated_pk = True  # pylint: disable=W0212
        else:
            # If an alert already exists in the database, update it
            ack_time = datetime.now()
            unix_millis_acknowledged_time = round(ack_time.timestamp() * 1e3)
            alert.update_from_dict(
                {
                    "acknowledged_by": self.user.username,
                    "unix_millis_acknowledged_time": unix_millis_acknowledged_time,
                }
            )

        await alert.save()

        # Save in logs who was the user that acknowledged the task
        try:
            await self.task_repo.save_log_acknowledged_task_completion(
                alert.id, self.user.username, unix_millis_acknowledged_time
            )
        except Exception as e:
            raise RuntimeError(
                f"Error in save_log_acknowledged_task_completion {e}"
            ) from e

        alert_pydantic = await ttm.AlertPydantic.from_tortoise_orm(alert)
        return alert_pydantic


def alert_repo_dep(
    user: User = Depends(user_dep), task_repo: TaskRepository = Depends(task_repo_dep)
):
    return AlertRepository(user, task_repo)
