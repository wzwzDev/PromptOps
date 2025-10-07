# 🚀 PromptOps Dashboard# 🚀 PromptOps Dashboard



[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.2-009688.svg)](https://fastapi.tiangolo.com)[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.2-009688.svg)](https://fastapi.tiangolo.com)

[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org)[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org)

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)



A comprehensive, enterprise-grade prompt engineering and management platform designed for AI professionals, developers, and organizations working with Large Language Models (LLMs). PromptOps combines advanced prompt optimization, career development tools, and analytics in a unified dashboard.A comprehensive, enterprise-grade prompt engineering and management platform designed for AI professionals, developers, and organizations working with Large Language Models (LLMs). PromptOps combines advanced prompt optimization, career development tools, and analytics in a unified dashboard.



## 🌟 Key Features## 🌟 Key Features



### 🎯 **Prompt Engineering Suite**### 🎯 **Prompt Engineering Suite**

- **Prompt Library**: Create, version, and manage prompts with advanced tagging and categorization- **Prompt Library**: Create, version, and manage prompts with advanced tagging and categorization

- **Template System**: Pre-built, customizable templates for common use cases- **Template System**: Pre-built, customizable templates for common use cases

- **A/B Testing**: Run comprehensive prompt tests with performance metrics- **A/B Testing**: Run comprehensive prompt tests with performance metrics

- **Analytics Dashboard**: Real-time insights into prompt performance and usage patterns- **Analytics Dashboard**: Real-time insights into prompt performance and usage patterns

- **Collaboration Tools**: Share prompts with team members and gather feedback- **Collaboration Tools**: Share prompts with team members and gather feedback

- **AI-Powered Optimization**: Automated prompt improvements and suggestions- **AI-Powered Optimization**: Automated prompt improvements and suggestions



### 💼 **Career Development Tools**### 💼 **Career Development Tools**

- **Executive CV Generation**: Create ATS-optimized, 2-3 page professional resumes- **Executive CV Generation**: Create ATS-optimized, 2-3 page professional resumes

- **Job Fit Analysis**: AI-powered compatibility scoring with job requirements- **Job Fit Analysis**: AI-powered compatibility scoring with job requirements

- **Interview Preparation**: Comprehensive coaching with 15+ role-specific questions- **Interview Preparation**: Comprehensive coaching with 15+ role-specific questions

- **Skills Gap Analysis**: Identify missing skills and get improvement recommendations- **Skills Gap Analysis**: Identify missing skills and get improvement recommendations

- **Company Research**: Structured guidance for interview preparation- **Company Research**: Structured guidance for interview preparation



### 📊 **Advanced Analytics**### 📊 **Advanced Analytics**

- **Usage Tracking**: Monitor prompt performance and success rates- **Usage Tracking**: Monitor prompt performance and success rates

- **Trend Analysis**: Visualize usage patterns over time- **Trend Analysis**: Visualize usage patterns over time

- **Performance Metrics**: Detailed analytics for individual prompts- **Performance Metrics**: Detailed analytics for individual prompts

- **Success Rate Monitoring**: Track and optimize prompt effectiveness- **Success Rate Monitoring**: Track and optimize prompt effectiveness



## 🏗️ Architecture## 🏗️ Architecture



``````

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐

│   Frontend      │    │    Backend      │    │   Database      ││   Frontend      │    │    Backend      │    │   Database      │

│   React + Vite  │◄──►│   FastAPI       │◄──►│   SQLite        ││   React + Vite  │◄──►│   FastAPI       │◄──►│   SQLite        │

│   Chakra UI     │    │   SQLModel      │    │   SQLModel ORM  ││   Chakra UI     │    │   SQLModel      │    │   SQLModel ORM  │

└─────────────────┘    └─────────────────┘    └─────────────────┘└─────────────────┘    └─────────────────┘    └─────────────────┘

         │                       │                       │         │                       │                       │

         │              ┌─────────────────┐              │         │              ┌─────────────────┐              │

         └──────────────►│   Docker        │◄─────────────┘         └──────────────►│   Docker        │◄─────────────┘

                        │   Compose       │                        │   Compose       │

                        └─────────────────┘                        └─────────────────┘

``````



**Tech Stack:****Tech Stack:**

- **Backend**: FastAPI, SQLModel, SQLite, Python 3.11+- **Backend**: FastAPI, SQLModel, SQLite, Python 3.11+

- **Frontend**: React 18, TypeScript, Chakra UI, Vite- **Frontend**: React 18, TypeScript, Chakra UI, Vite

- **AI Integration**: OpenAI GPT-4, Pinecone Vector Database- **AI Integration**: OpenAI GPT-4, Pinecone Vector Database

- **DevOps**: Docker, Docker Compose- **DevOps**: Docker, Docker Compose

- **Documentation**: Word document generation, PDF processing- **Documentation**: Word document generation, PDF processing



## 🚀 Quick Start## 🚀 Quick Start



### Prerequisites### Prerequisites

- **Docker** and **Docker Compose** installed- **Docker** and **Docker Compose** installed

- **Node.js 18+** (for local development)- **Node.js 18+** (for local development)

- **Python 3.11+** (for local development)- **Python 3.11+** (for local development)

- **OpenAI API Key** (optional, fallback responses available)- **OpenAI API Key** (optional, fallback responses available)



### 1. Clone the Repository### 1. Clone the Repository

```bash```bash

git clone https://github.com/wzwzDev/PromptOps.gitgit clone https://github.com/wzwzDev/PromptOps.git

cd PromptOpscd PromptOps

``````



### 2. Environment Setup### 2. Environment Setup

Create a `.env` file in the root directory:Create a `.env` file in the root directory:

```bash```bash

# OpenAI Configuration (Optional)# OpenAI Configuration (Optional)

OPENAI_API_KEY=your_openai_api_key_hereOPENAI_API_KEY=your_openai_api_key_here



# Pinecone Configuration (Optional)# Pinecone Configuration (Optional)

PINECONE_API_KEY=your_pinecone_api_key_herePINECONE_API_KEY=your_pinecone_api_key_here

PINECONE_ENVIRONMENT=your_pinecone_environmentPINECONE_ENVIRONMENT=your_pinecone_environment



# CORS Settings# CORS Settings

CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

``````



### 3. Launch with Docker (Recommended)### 3. Launch with Docker (Recommended)

```bash```bash

# Start all services# Start all services

docker-compose up --builddocker-compose up --build



# Or run in background# Or run in background

docker-compose up -d --builddocker-compose up -d --build

``````



### 4. Access the Application### 4. Access the Application

- **Frontend**: http://localhost:3000- **Frontend**: http://localhost:3000

- **Backend API**: http://localhost:8000- **Backend API**: http://localhost:8000

- **API Documentation**: http://localhost:8000/docs- **API Documentation**: http://localhost:8000/docs



### 5. Local Development (Optional)### 5. Local Development (Optional)



#### Backend Setup#### Backend Setup

```bash```bash

cd backendcd backend

python -m venv venvpython -m venv venv

source venv/bin/activate  # On Windows: venv\Scripts\activatesource venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txtpip install -r requirements.txt

uvicorn app.main:app --reload --port 8000uvicorn app.main:app --reload --port 8000

``````



#### Frontend Setup#### Frontend Setup

```bash```bash

cd frontendcd frontend

npm installnpm install

npm run devnpm run dev

``````



## 📚 User GuideTailwind + Vite notes:

- The frontend uses Tailwind via PostCSS. A named volume `promptops_frontend_node_modules` is mounted at `/app/node_modules` so dependencies persist across container rebuilds. If you ever see a PostCSS error like "Cannot find module 'tailwindcss'", rebuild the frontend or remove the volume once and re-up: `docker compose down -v; docker compose up --build`.

### 🎯 **Prompt Tools Overview**- Vite requires any CSS `@import` to come before all other statements. We keep the Google Fonts import at the very top of `src/index.css`.



#### 1. **Prompt Library**### Configure providers (optional)

Create and manage your prompt collection with advanced features:- Mock provider requires no setup.

- **Version Control**: Track prompt evolution and revert to previous versions- Ollama: Install Ollama and pull a local model (e.g., `ollama pull llama3:8b`), then ensure `OLLAMA_HOST` in `.env` points to your Ollama instance.

- **Tagging System**: Organize prompts with custom tags and categories- OpenAI: Set `OPENAI_API_KEY` in `.env` file.

- **Bulk Operations**: Export, import, and manage multiple prompts

- **Search & Filter**: Find prompts quickly with advanced search capabilitiesAll configuration is now handled via the `.env` file (copied from `.env.example`). The docker-compose will automatically load these environment variables.



#### 2. **Prompt Templates**Notes for Windows with Docker Desktop:

Access pre-built templates for common scenarios:- If Ollama runs on the host, set `OLLAMA_HOST=http://host.docker.internal:11434` so the container can reach it.

- **Business Communication**: Emails, proposals, reports- If Ollama runs in another container on the same compose network, use that service name (e.g., `http://ollama:11434`).

- **Content Creation**: Blog posts, social media, marketing copy

- **Technical Documentation**: API docs, user guides, specifications## Local Dev (no Docker)

- **Creative Writing**: Stories, poems, scriptsBackend:

- **Data Analysis**: Reports, summaries, insights```powershell

cd backend

#### 3. **Prompt Testing**python -m venv .venv; .venv\Scripts\Activate.ps1

Comprehensive testing environment:pip install -r requirements.txt

- **Sandbox Mode**: Test prompts safely without affecting production# optional: seed sample data

- **A/B Testing**: Compare multiple prompt versions side-by-sidepython -m app.seed

- **Batch Testing**: Run multiple prompts simultaneouslyuvicorn app.main:app --reload --port 8000

- **Performance Metrics**: Response time, token usage, success rates```

- **Quality Scoring**: Automated assessment of prompt effectiveness

Frontend:

#### 4. **Prompt Analytics**```powershell

Deep insights into prompt performance:cd frontend

- **Usage Statistics**: Track how often prompts are usednpm install

- **Success Rates**: Monitor prompt effectiveness over timenpm run dev

- **Performance Trends**: Visualize improvement patterns```

- **Token Consumption**: Optimize costs and efficiency

- **User Feedback**: Collect and analyze user ratingsIf you hit a CSS error "@import must precede all other statements", ensure the first line of `src/index.css` begins with the Google Fonts `@import` and that no comments or rules appear before it.



#### 5. **Prompt Sharing**## Run models (Runner UI and API)

Collaborate with team members:

- **Permission Management**: Control who can view, edit, or admin prompts### Runner UI

- **Comment System**: Provide feedback and suggestions- Open http://localhost:5173

- **Team Libraries**: Shared prompt collections for organizations- At the top, use the Runner panel to:

- **Export Capabilities**: Share prompts across platforms  - Pick a provider: `mock`, `ollama`, or `openai`

  - Enter a model (e.g., `gpt-4o-mini`, `gpt-5` for mock, `llama3:8b` for Ollama)

#### 6. **Search & Discovery**  - Optionally set `version` (v1/v2/v3)

AI-powered prompt discovery:  - Enter your prompt and click Run

- **Semantic Search**: Find prompts by meaning, not just keywords- The response shows with latency and token count; the run is logged and appears in the table/charts.

- **Smart Suggestions**: AI-recommended prompts based on context

- **Similar Prompts**: Discover related prompts automatically### API: POST /api/run

- **Usage Patterns**: Find popular and effective promptsRequest body (JSON):



#### 7. **Mutation & Feedback**```json

Continuous improvement tools:{

- **Automated Optimization**: AI-powered prompt improvements  "provider": "mock | ollama | openai",

- **Quality Scoring**: Objective assessment of prompt quality  "model": "string",

- **Suggestion Engine**: Recommendations for prompt enhancement  "prompt": "string",

- **Community Feedback**: Crowdsourced prompt evaluation  "version": "v1",

  "temperature": 0.7

### 💼 **Career Tools Overview**}

```

#### **Profile Upload**

- Upload your existing CV or create a new profilePowerShell examples:

- Structured data extraction from PDFs

- Manual profile editing and enhancement```powershell

- Skills and experience categorization# mock (no setup required)

Invoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (

#### **CV Generation**  @{ provider='mock'; model='gpt-5'; prompt='Hello from mock'; version='v2'; temperature=0.2 } | ConvertTo-Json

Transform your profile into executive-level resumes:)

- **ATS Optimization**: Keyword matching and formatting

- **Executive Format**: 2-3 page professional layout# ollama (requires OLLAMA_HOST and a pulled model such as llama3:8b)

- **STAR Method**: Structured achievement descriptionsInvoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (

- **Quantified Results**: Metrics-driven accomplishments  @{ provider='ollama'; model='llama3:8b'; prompt='Write a haiku about dashboards'; version='v2'; temperature=0.7 } | ConvertTo-Json

- **Industry Tailoring**: Customized for specific roles and companies)

- **Cover Letter**: Compelling, personalized cover letters

# openai (requires OPENAI_API_KEY)

#### **Job Fit Analysis**Invoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (

Intelligent matching between your profile and job requirements:  @{ provider='openai'; model='gpt-4o-mini'; prompt='Summarize: prompt versioning best practices'; version='v3'; temperature=0.5 } | ConvertTo-Json

- **Compatibility Scoring**: Percentage match with job descriptions)

- **Skills Gap Analysis**: Identify missing skills and experience```

- **Improvement Recommendations**: Targeted suggestions for enhancement

- **Keyword Extraction**: Automatic identification of important job requirementsResponse shape:

- **Strengths Highlighting**: Showcase your best-matching qualifications

```json

#### **Interview Preparation**{

Comprehensive coaching for interview success:  "provider": "mock",

- **Question Generation**: 15-20 role-specific questions  "model": "gpt-5",

- **Answer Frameworks**: STAR method and other proven techniques  "version": "v2",

- **Company Research**: Structured preparation guidance  "prompt": "...",

- **Behavioral Scenarios**: Situation-based question practice  "response": "...",

- **Technical Questions**: Role-specific technical assessments  "tokens": 123,

- **Salary Negotiation**: Strategic advice and market research  "latency_ms": 350

}

## 🔧 API Reference```



### **Prompt Endpoints**## SDK usage

```http```python

GET    /prompts/              # List all promptsfrom promptops import log_prompt

POST   /prompts/              # Create new promptlog_prompt(

GET    /prompts/{id}          # Get specific prompt    prompt="Summarize this text",

PUT    /prompts/{id}          # Update prompt    response="...",

DELETE /prompts/{id}          # Delete prompt    model="gpt-4o-mini",

POST   /prompts/test          # Test prompt execution  version="v2",  # optional

```    tokens=123,

    latency_ms=420,

### **Template Endpoints**    temperature=0.7,

```http)

GET    /templates/            # List all templates```

POST   /templates/            # Create new template

GET    /templates/{id}        # Get specific template## API Examples

``````powershell

# Create log

### **Analytics Endpoints**curl -X POST http://localhost:8000/api/logs -H "Content-Type: application/json" -d '{

```http  "prompt": "Hello",

GET    /analytics/            # Get analytics data  "response": "Hi",

GET    /analytics/summary     # Get aggregated summary  "model": "gpt-4o-mini",

GET    /analytics/prompt/{id} # Get prompt-specific analytics  "temperature": 0.7,

```  "tokens": 10,

  "latency_ms": 150

### **Career Tools Endpoints**}'

```http

POST   /api/career/generate           # Generate tailored CV# List logs

POST   /api/career/interview-questions # Generate interview questionscurl http://localhost:8000/api/logs

POST   /api/career/analyze-job-fit    # Analyze job compatibility

GET    /api/career/download_cv        # Download generated CV# Metrics

```curl http://localhost:8000/api/metrics

```

### **Search Endpoints**

```http## License

POST   /search/suggestions     # Get AI-powered suggestionsMIT

POST   /search/improve         # Get prompt improvements
GET    /search/prompts         # Search prompts
```

## 🚀 Deployment

### **Production Deployment**

#### **Docker Production**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

#### **Environment Variables (Production)**
```bash
# Required
OPENAI_API_KEY=your_production_api_key
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com
```

### **Cloud Deployment Options**
- **AWS**: ECS, Lambda, EC2
- **Google Cloud**: Cloud Run, Compute Engine
- **Azure**: Container Instances, App Service
- **DigitalOcean**: App Platform, Droplets
- **Railway**: One-click deployment
- **Vercel**: Frontend deployment

## 📊 Performance & Scalability

### **Performance Metrics**
- **API Response Time**: < 100ms for most endpoints
- **Database Queries**: Optimized with proper indexing
- **Memory Usage**: < 512MB for typical workloads
- **Concurrent Users**: Supports 100+ simultaneous users

### **Scalability Features**
- **Horizontal Scaling**: Stateless architecture
- **Database Optimization**: Connection pooling and query optimization
- **Caching**: Redis integration ready
- **Load Balancing**: Docker Swarm and Kubernetes support

## 🔒 Security

### **Security Features**
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: SQLModel ORM protection
- **CORS Configuration**: Configurable cross-origin settings
- **Rate Limiting**: API rate limiting capabilities
- **Environment Variables**: Secure configuration management

### **Best Practices**
- Regular dependency updates
- Secure API key management
- Database encryption at rest
- HTTPS enforcement in production
- Audit logging capabilities

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Setup**
```bash
# Clone your fork
git clone https://github.com/yourusername/PromptOps.git
cd PromptOps

# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run tests
cd backend && python -m pytest
cd frontend && npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing powerful language models
- **FastAPI** for the excellent Python web framework
- **React** and **Chakra UI** for the frontend framework
- **SQLModel** for the database ORM
- **Docker** for containerization

## 📞 Support

- **Documentation**: Check our [User Guide](docs/USER_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/wzwzDev/PromptOps/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wzwzDev/PromptOps/discussions)
- **Email**: support@promptops.com

## 🗺️ Roadmap

### **Coming Soon**
- [ ] **Multi-language Support**: i18n for global users
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Team Management**: Organization and role management
- [ ] **API Integrations**: Third-party service connections
- [ ] **Mobile App**: iOS and Android applications
- [ ] **Enterprise Features**: SSO, advanced security, audit logs

### **Version History**
- **v1.2.0** (Current): Enhanced CV generation, advanced analytics
- **v1.1.0**: Interview preparation, job fit analysis
- **v1.0.0**: Core prompt management, basic analytics
- **v0.9.0**: Initial release, basic functionality

---

<div align="center">
  <p><strong>Built with ❤️ for the AI community</strong></p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>