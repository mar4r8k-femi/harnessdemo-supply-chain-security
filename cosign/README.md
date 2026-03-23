# Cosign Key Management & Attestation Guide

Setup guide for Cosign-based artifact signing and attestation used by the Harness SCS demo pipelines.

## 1. Generate Cosign Key Pair (ECDSA-P256)

```bash
# Generate a new key pair (creates cosign.key + cosign.pub)
cosign generate-key-pair

# You will be prompted for a password — store it securely
# Key algorithm: ECDSA-P256 (default)
```

Output:
- `cosign.key` — private key (used for signing attestations)
- `cosign.pub` — public key (used for verification)

## 2. Store Keys as Harness Secrets

Upload both keys and the passphrase to the Harness project:

| Secret Name | Type | File / Value |
|-------------|------|-------------|
| `demo_cosign_private` | File Secret | Upload `cosign.key` |
| `demo_cosign_public` | File Secret | Upload `cosign.pub` |
| `demo_cosign_password` | Text Secret | Cosign key passphrase |

**Steps:**
1. Navigate to **Project Settings → Secrets**
2. Click **+ New Secret → File** for each key file
3. Click **+ New Secret → Text** for the passphrase
4. Reference these secrets in the CI/CD pipeline YAML using identifiers above

## 3. in-toto Attestation Framework

Harness SCS uses the **in-toto attestation format** for both provenance and SBOM attestations. Cosign wraps in-toto predicates into signed attestation envelopes stored as `.att` files alongside container images in the registry.

### Attestation Types

| Attestation | Predicate Type | Content |
|------------|---------------|---------|
| SLSA Provenance | `https://slsa.dev/provenance/v1` | Repository, branch, commit SHA, builder ID, trigger, timestamp |
| SBOM (CycloneDX) | `https://cyclonedx.org/bom/v1.5` | Full CycloneDX SBOM document |
| SBOM (SPDX) | `https://spdx.dev/Document/v2.3` | Full SPDX SBOM document |

### Envelope Structure

```json
{
  "payloadType": "application/vnd.in-toto+json",
  "payload": "<base64-encoded predicate>",
  "signatures": [
    {
      "keyid": "",
      "sig": "<cosign signature>"
    }
  ]
}
```

The `.att` file in the registry contains this signed envelope. Harness SCS creates these automatically when attestation is enabled in the SBOM Orchestration or SLSA Generation steps.

## 4. Artifact Signing (.sig files)

Separate from attestation, Cosign can sign the image digest itself, producing a `.sig` file stored alongside the image in the registry.

### Sign an Image

```bash
# Sign with local key
cosign sign --key cosign.key <image>@<digest>

# Example
cosign sign --key cosign.key docker.io/supplywatch/backend@sha256:abc123...
```

### Verify a Signature

```bash
# Verify with public key
cosign verify --key cosign.pub <image>@<digest>

# Example
cosign verify --key cosign.pub docker.io/supplywatch/backend@sha256:abc123...
```

### Verify an Attestation

```bash
# Verify SBOM attestation
cosign verify-attestation \
  --key cosign.pub \
  --type cyclonedx \
  <image>@<digest>

# Verify SLSA provenance attestation
cosign verify-attestation \
  --key cosign.pub \
  --type slsaprovenance \
  <image>@<digest>
```

## 5. HashiCorp Vault Integration (Optional)

For enterprise key management, store Cosign keys in HashiCorp Vault instead of Harness file secrets.

### Setup

```bash
# Store the private key in Vault
vault kv put secret/cosign/private key=@cosign.key

# Store the public key in Vault
vault kv put secret/cosign/public key=@cosign.pub

# Store the passphrase
vault kv put secret/cosign/password value=<passphrase>
```

### Sign Using Vault Key

```bash
# Sign with key from Vault
cosign sign --key hashivault://secret/cosign/private <image>@<digest>

# Verify with key from Vault
cosign verify --key hashivault://secret/cosign/public <image>@<digest>
```

### Harness Vault Connector

1. Create a **HashiCorp Vault** connector in Harness (**Project Settings → Connectors**)
2. Configure the Vault URL, authentication method, and secret path
3. Reference Vault secrets in pipeline YAML:
   ```yaml
   attestation:
     type: cosign
     spec:
       privateKey: <vault_connector_ref>/secret/cosign/private
       password: <vault_connector_ref>/secret/cosign/password
   ```

## 6. Sigstore Rekor Transparency Log (Optional)

Cosign supports publishing attestation entries to the [Rekor](https://rekor.sigstore.dev) public transparency log for independent verifiability.

### Enable Rekor Logging

```bash
# Sign and publish to Rekor (default behavior when --rekor-url is not explicitly disabled)
cosign sign --key cosign.key <image>@<digest>

# Explicitly specify Rekor URL
cosign sign --key cosign.key --rekor-url=https://rekor.sigstore.dev <image>@<digest>
```

### Disable Rekor Logging

For air-gapped environments or when public transparency is not desired:

```bash
# Sign without publishing to Rekor
cosign sign --key cosign.key --tlog-upload=false <image>@<digest>
```

### Verify with Rekor

```bash
# Verify signature and check Rekor inclusion proof
cosign verify --key cosign.pub --rekor-url=https://rekor.sigstore.dev <image>@<digest>
```

### When to Use Rekor

| Scenario | Rekor Recommended? |
|----------|-------------------|
| Public open-source projects | Yes — transparency builds trust |
| Customer-facing compliance audits | Yes — independent proof of signing |
| Internal enterprise builds | Optional — depends on policy |
| Air-gapped / classified environments | No — disable with `--tlog-upload=false` |

## 7. Registry Storage Layout

After a CI build with attestation enabled, the registry contains:

```
supplywatch/backend
├── sha256:abc123...          # Image manifest
├── sha256:abc123....sig      # Cosign signature (.sig)
├── sha256:abc123....att      # in-toto attestation envelope (.att)
│   ├── SLSA provenance predicate
│   └── SBOM predicate (CycloneDX or SPDX)
```

The Harness SCS Supply Chain tab in pipeline execution shows these attestations and provides download links for the provenance file.
