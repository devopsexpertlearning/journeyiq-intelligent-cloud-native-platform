# ADR 003: Kustomize vs Helm for Kubernetes

**Status:** Accepted  
**Date:** 2026-01-10  
**Deciders:** Platform Architecture Team

## Context

We needed a way to manage Kubernetes manifests across multiple environments (dev, staging, prod) with different configurations.

Requirements:
- Environment-specific overrides (replicas, resources, images)
- DRY (Don't Repeat Yourself) principle
- Easy to understand and maintain
- GitOps friendly
- No external dependencies

## Decision

We chose **Kustomize** over **Helm** for Kubernetes manifest management.

## Rationale

### Why Kustomize?

1. **Native to Kubernetes**
   - Built into `kubectl` (v1.14+)
   - No additional tools required
   - Official Kubernetes project

2. **Template-Free**
   - Pure YAML, no templating language
   - What you see is what you deploy
   - Easier to debug

3. **Patch-Based**
   - Base manifests + overlays
   - Clear inheritance model
   - Easy to see what changes per environment

4. **GitOps Friendly**
   - Works great with ArgoCD/Flux
   - Declarative configuration
   - Easy to review in PRs

5. **Simpler Learning Curve**
   - Just YAML + patches
   - No Go templating syntax
   - Familiar to Kubernetes users

### Why Not Helm?

**Helm (Kubernetes Package Manager):**
- ❌ Complex templating (Go templates)
- ❌ Additional tool dependency
- ❌ Harder to debug template issues
- ✅ Rich ecosystem (Helm charts)
- ✅ Versioned releases
- ✅ Rollback support

**Trade-off:** We chose simplicity and native integration over Helm's package management features.

## Consequences

### Positive
- No external dependencies
- Easier to understand for team
- Better GitOps integration
- Clearer diffs in PRs

### Negative
- No built-in versioning
- No package repository
- Need to manage rollbacks manually
- Less community charts available

### Neutral
- Need to create our own base manifests
- More explicit configuration

## Implementation

**Directory Structure:**
```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

**Base (k8s/base/kustomization.yaml):**
```yaml
resources:
  - deployment.yaml
  - service.yaml
```

**Overlay (k8s/overlays/prod/kustomization.yaml):**
```yaml
bases:
  - ../../base

patchesStrategicMerge:
  - replicas.yaml
  - resources.yaml

images:
  - name: auth-service
    newTag: v1.2.3
```

**Deploy:**
```bash
kubectl apply -k k8s/overlays/prod
```

## Migration Path

If we need Helm features later:
1. Keep Kustomize for base manifests
2. Use Helm for third-party charts (Prometheus, etc.)
3. Hybrid approach: Kustomize for our services, Helm for infrastructure

## References

- [Kustomize Documentation](https://kustomize.io/)
- [Kubernetes SIG CLI](https://github.com/kubernetes-sigs/kustomize)
- Internal: `k8s/` directory structure
