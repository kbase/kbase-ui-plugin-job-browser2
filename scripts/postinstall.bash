echo "Running plugin post install script"
cd src/react-app && \
npm install && \
npm run build && \
npm run test -- --watchAll=false && \
npm run plugin
