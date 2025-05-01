#!/bin/bash

# Load .env.tools file
ENV_FILE=".env.tools"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Missing $ENV_FILE file. Aborting."
  exit 1
fi

# Prompt for commit message
echo "Enter commit message:"
read COMMIT_MSG

# Validate commit message is not empty
if [ -z "$COMMIT_MSG" ]; then
  echo "Error: Commit message cannot be empty"
  exit 1
fi

REMOTE_SCRIPT="/root/my_schedule/tools/deploy_in_server.sh"

# Step 1: Git add, commit, and push
echo "Adding all changes..."
git add .

echo "Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo "Pushing to origin..."
git push origin main

# Step 2: SSH into the server and run the remote script
echo "Deploying to server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "bash $REMOTE_SCRIPT"
