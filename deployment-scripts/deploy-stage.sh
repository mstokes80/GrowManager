tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='target' \
    --exclude='dist' \
    --exclude='.env*' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.idea' \
    --exclude='.vscode' \
    -czf growmanager-deploy.tar.gz .

scp growmanager-deploy.tar.gz 192.168.2.25:/opt/growmanager/
