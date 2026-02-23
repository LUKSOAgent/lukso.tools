#!/bin/bash
# Setup script for new agents to join the shared brain

SHARED_CONTEXT="/root/.openclaw/workspace/shared-context"
AGENT_DIR="$1"

if [ -z "$AGENT_DIR" ]; then
    echo "Usage: $0 /path/to/agent/workspace"
    exit 1
fi

if [ ! -d "$AGENT_DIR" ]; then
    echo "Creating agent directory: $AGENT_DIR"
    mkdir -p "$AGENT_DIR"
fi

# Create symlink
ln -s "$SHARED_CONTEXT" "$AGENT_DIR/shared-context"

echo "Agent linked to shared brain at: $AGENT_DIR/shared-context"
echo ""
echo "Agent MUST read shared-context/priorities.md before each run"
echo "Agent SHOULD check shared-context/feedback/ for lessons"
echo "Agent MUST write outputs to shared-context/agent-outputs/{agent-name}/"