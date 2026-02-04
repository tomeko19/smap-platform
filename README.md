# smap-platform

Secure Multi-Tenant Cloud-Native Platform (SMAP)
Project Overview

SMAP is a cloud-native platform designed to demonstrate modern Platform Engineering and Cloud-Native Architecture principles.
The project focuses on building a secure, observable, GitOps-driven API platform that supports both synchronous REST APIs and asynchronous event-driven workloads.

The platform is deployed on Kubernetes and fully managed using GitOps with ArgoCD, where Git is the single source of truth for infrastructure, platform services, and applications.

Key Objectives

Design and operate a production-like cloud-native platform using Kubernetes

Implement centralized authentication and fine-grained authorization

Expose APIs through a secure API Gateway

Support event-driven communication using Kafka

Ensure full observability across the platform

Apply GitOps and Helm-based deployments end to end

Architecture Highlights

Kubernetes as the runtime platform (local cluster for development)

ArgoCD for continuous delivery and GitOps workflows

Helm as the deployment and packaging mechanism for all components

Security

Keycloak for OpenID Connect authentication and identity management

Cerbos for fine-grained, policy-based authorization

JWT-based access control enforced at the API Gateway layer

Vault (dev mode) for secrets management

API & Networking

Kong API Gateway as the single entry point to the platform

Custom authorization logic integrated at the gateway level

Event-Driven Architecture

Apache Kafka (via Strimzi) as the event backbone

Services communicate asynchronously using domain events

Example use case: order processing and inventory management

Data Layer

MongoDB for service-level data persistence

Each service owns its data following microservices principles

Observability

Prometheus for metrics collection

Grafana for visualization and dashboards

Platform-level and application-level metrics exposed and monitored

Example Use Case

The platform simulates a multi-tenant inventory and order management system:

REST APIs handle synchronous operations

Domain events are published to Kafka for asynchronous processing

Inventory updates, reporting, and auditing are handled by independent consumers

Deployment Model

All components are deployed using Helm charts

ArgoCD continuously reconciles the desired state from Git

No manual deployments or imperative Kubernetes commands are required

Target Audience

This project is intended to demonstrate skills relevant to:

Platform Engineers

Cloud-Native Engineers

DevOps / GitOps Engineers

Solutions and Cloud Architects

Why This Project Matters

SMAP reflects real-world enterprise patterns:

Security-first design

Platform abstraction for application teams

Event-driven scalability

Strong separation of concerns

Operational visibility by default

It serves as a production-inspired reference architecture for building and operating modern cloud-native platforms
