"""雪花 ID 生成器（进程内单例）。

多实例部署时必须为每个实例配置不同的 worker_id（0-31），
否则会生成重复主键。worker_id 来自环境变量 SNOWFLAKE_WORKER_ID。
"""
import threading
import time

from app.config import settings

# Twitter/Snowflake 经典位分配：41 位时间戳 + 10 位机器号 + 12 位序列号
EPOCH = 1_700_000_000_000  # 自定义起始时间戳（毫秒），上线后不要改动
WORKER_ID_BITS = 5
SEQUENCE_BITS = 12
MAX_WORKER_ID = (1 << WORKER_ID_BITS) - 1  # 31
MAX_SEQUENCE = (1 << SEQUENCE_BITS) - 1  # 4095


class SnowflakeGenerator:
    def __init__(self, worker_id: int):
        if not 0 <= worker_id <= MAX_WORKER_ID:
            raise ValueError(f"worker_id 必须在 0-{MAX_WORKER_ID} 之间")
        self.worker_id = worker_id
        self.last_timestamp = -1
        self.sequence = 0
        self._lock = threading.Lock()

    def generate(self) -> int:
        # 加锁保证多线程下 sequence 不冲突
        with self._lock:
            timestamp = int(time.time() * 1000)
            if timestamp < self.last_timestamp:
                raise RuntimeError("系统时钟回拨，拒绝生成 ID")
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & MAX_SEQUENCE
                if self.sequence == 0:
                    while int(time.time() * 1000) <= self.last_timestamp:
                        time.sleep(0.001)
                    timestamp = int(time.time() * 1000)
            else:
                self.sequence = 0

            self.last_timestamp = timestamp
            return (
                ((timestamp - EPOCH) << (WORKER_ID_BITS + SEQUENCE_BITS))
                | (self.worker_id << SEQUENCE_BITS)
                | self.sequence
            )


_generator = SnowflakeGenerator(worker_id=settings.SNOWFLAKE_WORKER_ID)


def generate_snowflake_id() -> int:
    """生成下一个雪花 ID（供 ORM 主键默认值调用）。"""
    return _generator.generate()
