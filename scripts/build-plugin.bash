echo "Running plugin post install script"
cd react-app && \
yarn install --no-lockfile --cache-folder=".yarn-cache" && \
echo "✓ dependencies installed successfully" && \
yarn build && \
echo "✓ built successfully" && \
echo "SKIPPING TESTS" && \
yarn install-plugin && \
echo "✓ plugin setup successfully" && \
echo "✓ plugin installed successfully"
