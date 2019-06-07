echo "Running plugin post install script"
cd src/react-app && \
npm install && \
npm run build && \
npm run plugin
# npm run test -- --watchAll=false && \
# rm -rf ../plugin/iframe_root/* && \
# cp -pr build/* ../plugin/iframe_root