# System Architecture

## System Context
JourneyIQ is a cloud-native travel booking platform designed for scale and resilience. It uses a microservices architecture on Google Kubernetes Engine (GKE).

```mermaid
C4Context
    title System Context Diagram for JourneyIQ
    
    Person(user, "Traveler", "A user searching and booking travel.")
    System_Boundary(journeyiq, "JourneyIQ Platform") {
        System(web, "Web/Mobile App", "Frontend interface.")
        System(api, "API Gateway", "Unified entry point.")
        System(ai, "AI Agent", "LLM-powered assistant.")
    }
    System_Ext(gcp, "Google Cloud", "Hosting & Infrastructure")
    System_Ext(llm, "LLM Provider", "OpenAI/Gemini")
    
    Rel(user, web, "Uses")
    Rel(web, api, "API Calls", "HTTPS/JSON")
    Rel(web, ai, "Chat", "WebSocket/HTTPS")
    Rel(ai, llm, "Inference", "API")
```

## Microservices Event Flow (The Booking Saga)
Communication between services is handled primarily via synchronous API calls for reads and asynchronous Events (Pub/Sub) for writes and sagas.

```mermaid
sequenceDiagram
    participant User
    participant API as API Gateway
    participant Booking as Booking Service
    participant Payment as Payment Service
    participant Inventory as Inventory Service
    participant Notif as Notification Service
    participant PubSub

    User->>API: POST /bookings
    API->>Booking: Create Booking Request
    Booking->>Booking: Validate Request
    Booking->>PubSub: Publish "BookingCreated"
    
    par Inventory Reservation
        PubSub->>Inventory: Consume "BookingCreated"
        Inventory->>Inventory: Reserve Seat
        Inventory->>PubSub: Publish "SeatReserved"
    and Payment Processing
        PubSub->>Payment: Consume "BookingCreated"
        Payment->>Payment: Charge User
        Payment->>PubSub: Publish "PaymentSuccess"
    end
    
    PubSub->>Booking: Consume "SeatReserved" & "PaymentSuccess"
    Booking->>Booking: Update Status to CONFIRMED
    Booking->>PubSub: Publish "BookingConfirmed"
    
    PubSub->>Notif: Consume "BookingConfirmed"
    Notif->>User: Send Email/SMS
```

## AI Agent RAG Pipeline
The AI Agent uses a RAG pipeline to answer policy-related questions.

```mermaid
flowchart LR
    User(User Query) --> Agent
    Agent --> Router{Is Policy?}
    Router -- Yes --> Vector store
    Vector store -- SIMILARITY SEARCH --> Documents
    Documents --> Context
    Context --> LLM
    LLM --> Response
    Router -- No --> Tools(Flight Search/Booking)
    Tools --> Response
```
