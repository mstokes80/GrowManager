# GrowManager - Cannabis Grow Journal & Analytics Platform

GrowManager is a comprehensive grow journal and analytics platform designed to help cannabis cultivators track their grows, monitor plant health, manage harvests, and analyze performance over time.

## Project Overview

GrowManager Phase 1 MVP focuses on manual tracking foundation with the following core features:
- User authentication and authorization
- Grow creation and management
- Plant lifecycle tracking
- Photo upload and management
- Harvest recording
- Basic analytics and reporting

## Technology Stack

### Backend
- **Framework:** Spring Boot 3.x
- **Language:** Java 17+
- **Database:** PostgreSQL 14+
- **Caching:** Redis
- **Object Storage:** MinIO (S3-compatible)
- **Build Tool:** Maven
- **Key Dependencies:**
  - Spring Web
  - Spring Data JPA
  - Spring Security
  - Flyway (Database Migrations)
  - Lombok
  - Bean Validation

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript
- **State Management:** Zustand
- **Routing:** React Router
- **Data Fetching:** React Query
- **Forms:** React Hook Form + Zod
- **UI Framework:** Tailwind CSS + shadcn/ui

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitHub Actions
- **Code Quality:** SonarQube, ESLint, Prettier, Checkstyle

## Project Structure

```
GrowManager/
├── growmanager-api/          # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/growmanager/
│   │   │   │       ├── controller/
│   │   │   │       ├── service/
│   │   │   │       ├── repository/
│   │   │   │       ├── entity/
│   │   │   │       ├── dto/
│   │   │   │       ├── config/
│   │   │   │       ├── security/
│   │   │   │       └── exception/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/
│   │   └── test/
│   └── pom.xml
├── growmanager-ui/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── stores/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Docker and Docker Compose
- Maven 3.8+
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GrowManager
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```
   This starts PostgreSQL, Redis, and MinIO.

3. **Set up backend**
   ```bash
   cd growmanager-api
   cp .env.example .env
   # Edit .env with your local configuration
   mvn clean install
   mvn spring-boot:run
   ```
   Backend runs on http://localhost:8080

4. **Set up frontend**
   ```bash
   cd growmanager-ui
   cp .env.example .env
   # Edit .env with your local configuration
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:5173

### Environment Configuration

#### Backend (.env)
See `growmanager-api/.env.example` for required environment variables.

#### Frontend (.env)
See `growmanager-ui/.env.example` for required environment variables.

### Running Tests

**Backend:**
```bash
cd growmanager-api
mvn test
```

**Frontend:**
```bash
cd growmanager-ui
npm test
```

## Docker Services

The `docker-compose.yml` provides the following services:

- **PostgreSQL** - Port 5432
  - Database: growmanager
  - User: growmanager
  - Password: (set in .env)

- **Redis** - Port 6379
  - Used for session caching and rate limiting

- **MinIO** - Ports 9000 (API), 9001 (Console)
  - S3-compatible object storage for photos
  - Console: http://localhost:9001

## Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches

### Making Changes
1. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. Push and create a pull request to `develop`
   ```bash
   git push origin feature/your-feature-name
   ```

## API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support, please open an issue in the GitHub repository.