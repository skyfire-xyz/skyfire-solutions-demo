# Use official Python image as base
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Copy requirements and source code
COPY ./requirements.txt ./requirements.txt
COPY ./agent.py ./agent.py

# Install dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Set environment variables (optional, can be overridden)
# ENV OPENAI_API_KEY=your_api_key_here

# Set the entrypoint to run the script
CMD ["python", "agent.py"]