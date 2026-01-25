# Architecture Diagrams Directory

This directory contains high-resolution architecture diagrams for portfolio presentation.

## Diagram List

### 1. System Architecture
- **File:** `system-architecture.png`
- **Source:** `docs/ARCHITECTURE.md` (Mermaid diagram)
- **Shows:** All 15 microservices, data layer, event bus, AI components

### 2. Booking Flow Sequence
- **File:** `booking-flow-sequence.png`
- **Shows:** Complete booking flow from search to confirmation
- **Services:** Search → Booking → Payment → Notification

### 3. AI Agent Architecture
- **File:** `ai-agent-architecture.png`
- **Source:** `docs/AI.md`
- **Shows:** LangGraph state machine, RAG pipeline, vector store

### 4. Infrastructure Topology
- **File:** `infrastructure-topology.png`
- **Shows:** GKE cluster, Cloud SQL, Pub/Sub, networking

### 5. Observability Stack
- **File:** `observability-stack.png`
- **Shows:** Prometheus, Grafana, Loki, Tempo, service instrumentation

### 6. CI/CD Pipeline
- **File:** `cicd-pipeline.png`
- **Shows:** GitHub Actions workflow, testing, security scans, deployment

## How to Generate

### From Mermaid Diagrams

1. **Install Mermaid CLI:**
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

2. **Generate from ARCHITECTURE.md:**
   ```bash
   # Extract Mermaid code to temp file
   mmdc -i architecture.mmd -o system-architecture.png -w 2000 -H 1500
   ```

3. **High-res settings:**
   - Width: 2000px
   - Height: 1500px
   - Background: white
   - Theme: default

### Using draw.io

1. Create diagrams in draw.io
2. Export as PNG
3. Settings:
   - Transparent background: No
   - Border width: 10px
   - Scale: 200%

### Using Lucidchart

1. Create professional diagrams
2. Export as PNG
3. Resolution: High (300 DPI)

## Diagram Specifications

- **Format:** PNG (for screenshots), SVG (for web)
- **Resolution:** Minimum 2000x1500px
- **DPI:** 300 for print quality
- **Background:** White or transparent
- **Font:** Clear, readable (14pt minimum)
- **Colors:** Professional palette (blues, greens, grays)

## Diagram Standards

### Color Coding
- **Services:** Blue (#4A90E2)
- **Databases:** Green (#7ED321)
- **Message Queues:** Orange (#F5A623)
- **AI Components:** Purple (#9013FE)
- **Infrastructure:** Gray (#4A4A4A)

### Icons
Use consistent icon set:
- Microservices: Hexagon
- Databases: Cylinder
- APIs: Rectangle with rounded corners
- Events: Diamond
- Users: Person icon

## Usage

These diagrams will be used in:
- Portfolio presentations
- Technical documentation
- Client proposals
- Blog posts
- Conference talks

## Tools Recommended

- **Mermaid:** For code-based diagrams
- **draw.io:** Free, web-based
- **Lucidchart:** Professional, collaborative
- **Excalidraw:** Hand-drawn style
- **PlantUML:** Code-based UML

## Current Diagrams

✅ System architecture (in ARCHITECTURE.md)  
✅ AI agent flow (in AI.md)  
⏳ Booking flow sequence (to be created)  
⏳ Infrastructure topology (to be created)  
⏳ Observability stack (to be created)  
⏳ CI/CD pipeline (to be created)  
