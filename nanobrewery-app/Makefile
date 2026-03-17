.PHONY: help setup backend frontend dev test clean

help:
	@echo "Nanobrewery App - Available Commands"
	@echo "===================================="
	@echo "make setup      - Install all dependencies"
	@echo "make backend    - Start backend server"
	@echo "make frontend   - Start frontend dev server"
	@echo "make dev        - Start both backend and frontend"
	@echo "make test       - Run tests"
	@echo "make clean      - Remove build artifacts"
	@echo "make docker     - Run with Docker Compose"

setup:
	@echo "Setting up project..."
	cd server/beer_backend && pip install -r requirements.txt
	cd client/nano-beer && npm install
	@echo "✓ Setup complete!"

backend:
	cd server/beer_backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002

frontend:
	cd client/nano-beer && npm run dev

dev:
	@echo "Starting development environment..."
	@echo "Backend: http://localhost:8002"
	@echo "Frontend: http://localhost:5175"
	@make backend & @make frontend

test:
	cd server/beer_backend && pytest tests/

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type d -name node_modules -exec rm -r {} +
	find . -type d -name dist -exec rm -r {} +
	find . -type d -name .pytest_cache -exec rm -r {} +
	@echo "✓ Clean complete!"

docker:
	docker-compose up --build

docker-down:
	docker-compose down
