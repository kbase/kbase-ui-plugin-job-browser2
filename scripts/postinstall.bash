echo "Running plugin post install script"
cd src/react-app && \
npm install && \
echo "✓ dependencies installed successfully" && \
npm run build && \
echo "✓ built successfully" && \
npm run test -- --watchAll=false && \
echo "✓ tests run successfully" && \
npm run plugin && \
echo "✓ plugin setup successfully" && \
echo "✓ plugin installed successfully"
