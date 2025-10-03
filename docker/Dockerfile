# 构建阶段
FROM python:3.12-slim as builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# 复制并安装Python依赖
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# 生产阶段
FROM python:3.12-slim

WORKDIR /app

# 复制已安装的依赖
COPY --from=builder /root/.local /root/.local

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/root/.local/bin:$PATH

# 暴露端口
EXPOSE 8000

# 创建非root用户
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# 运行应用
CMD ["python", "app.py"]