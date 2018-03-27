FROM f5devcentral/f5-api-services-gateway
RUN mkdir -p /root/lx/

# Copy directories into /root/lx path to be installed on container start
COPY nodejs /root/lx/ipAddressExpansion/nodejs/
COPY presentation /root/lx/ipAddressExpansion/presentation/
COPY manifest.json /root/lx/ipAddressExpansion/
