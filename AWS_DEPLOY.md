# Deploy SupplyWatch to AWS (Demo)

Cheapest way to run this app on AWS: a single EC2 spot instance running k3s (~$5-7/month).

## Prerequisites

- AWS account
- SSH key pair created in AWS
- Harness project with the pipeline already configured

## Step 1: Launch EC2 Instance

1. Go to **EC2 > Launch Instance**
2. Settings:
   - **Name**: `supplywatch-demo`
   - **AMI**: Ubuntu 24.04 LTS (ARM64)
   - **Instance type**: `t4g.medium` (2 vCPU, 4GB RAM)
   - **Key pair**: select your SSH key
   - **Storage**: 20GB gp3
3. Under **Network settings**, create a security group with:
   - SSH (port 22) — **My IP** only
   - HTTP (port 80) — **Anywhere** (0.0.0.0/0)
4. Under **Advanced details**:
   - **Purchasing option**: check **Request Spot Instances**
5. Launch the instance

## Step 2: Install k3s

SSH into the instance and run:

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Install k3s
curl -sfL https://get.k3s.io | sh -

# Verify it's running
sudo kubectl get nodes
```

## Step 3: Install the Harness Delegate

The Harness Delegate runs inside the cluster and allows the pipeline to deploy to it.

1. In Harness UI, go to **Project Settings > Delegates > New Delegate > Kubernetes**
2. Copy the generated YAML and apply it:
   ```bash
   sudo kubectl apply -f harness-delegate.yaml
   ```
3. Wait for the delegate to show as **Connected** in the Harness UI

## Step 4: Configure Harness Resources

1. **Kubernetes connector**: Create a new connector using "Connect through a Harness Delegate", select the delegate from step 3
2. **Environment**: Create a new environment (type: Production)
3. **Infrastructure definition**: Add one to the environment:
   - Type: KubernetesDirect
   - Connector: the one from step 1
   - Namespace: `supplywatch-prod`
4. **Service**: Create a Harness Service (type: Kubernetes), point the manifests to the `k8s/` directory in this repo

## Step 5: Deploy via the Pipeline

All deployments go through the Harness pipeline (`SCS Demo CI-CD Pipeline`), which enforces SBOM, SLSA, and artifact verification before deploying.

- **Automatic**: push to `main` triggers the pipeline
- **Manual**: run the pipeline from the Harness UI and provide the service, environment, and infra definition when prompted

Once the pipeline completes, open `http://<EC2-PUBLIC-IP>` in your browser.

> **Note**: The ingress must use `traefik` (k3s default) instead of `nginx`. Update `ingressClassName` in `k8s/ingress.yaml` and remove the `host` field before the first deploy.

## Cost Summary

| Component         | Cost/month |
| ----------------- | ---------- |
| t4g.medium spot   | ~$6-10     |
| 20GB gp3 EBS      | ~$1.60     |
| **Total**         | **~$8-12** |

## Tear Down

To stop costs, terminate the EC2 instance and delete the EBS volume in the AWS console.
