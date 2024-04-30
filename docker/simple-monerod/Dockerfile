# Initial base from https://github.com/leonardochaia/docker-monerod/blob/master/src/Dockerfile
# Alpine specifics from https://github.com/cornfeedhobo/docker-monero/blob/f96711415f97af1fc9364977d1f5f5ecd313aad0/Dockerfile

# Set Monero branch or tag to build
ARG MONERO_BRANCH=v0.18.3.2

# Set the proper HEAD commit hash for the given branch/tag in MONERO_BRANCH
ARG MONERO_COMMIT_HASH=ef3e18b51beb937c7f786ecef0d0a0e3f6295082

# Select Alpine 3.x for the build image base
FROM alpine:3.16 as build
LABEL author="seth@sethforprivacy.com" \
      maintainer="seth@sethforprivacy.com"

# Upgrade base image
RUN set -ex && apk --update --no-cache upgrade

# Install all dependencies for a static build
RUN set -ex && apk add --update --no-cache \
    autoconf \
    automake \
    boost \
    boost-atomic \
    boost-build \
    boost-build-doc \
    boost-chrono \
    boost-container \
    boost-context \
    boost-contract \
    boost-coroutine \
    boost-date_time \
    boost-dev \
    boost-doc \
    boost-fiber \
    boost-filesystem \
    boost-graph \
    boost-iostreams \
    boost-libs \
    boost-locale \
    boost-log \
    boost-log_setup \
    boost-math \
    boost-prg_exec_monitor \
    boost-program_options \
    boost-python3 \
    boost-random \
    boost-regex \
    boost-serialization \
    boost-stacktrace_basic \
    boost-stacktrace_noop \
    boost-static \
    boost-system \
    boost-thread \
    boost-timer \
    boost-type_erasure \
    boost-unit_test_framework \
    boost-wave \
    boost-wserialization \
    ca-certificates \
    cmake \
    curl \
    dev86 \
    doxygen \
    eudev-dev \
    file \
    g++ \
    git \
    graphviz \
    libexecinfo-dev \
    libsodium-dev \
    libtool \
    libusb-dev \
    linux-headers \
    make \
    miniupnpc-dev \
    ncurses-dev \
    openssl-dev \
    pcsc-lite-dev \
    pkgconf \
    protobuf-dev \
    rapidjson-dev \
    readline-dev \
    zeromq-dev

# Set necessary args and environment variables for building Monero
ARG MONERO_BRANCH
ARG MONERO_COMMIT_HASH
ARG NPROC
ARG TARGETARCH
ENV CFLAGS='-fPIC'
ENV CXXFLAGS='-fPIC -DELPP_FEATURE_CRASH_LOG'
ENV USE_SINGLE_BUILDDIR 1
ENV BOOST_DEBUG         1

# Build expat, a dependency for libunbound
RUN set -ex && wget https://github.com/libexpat/libexpat/releases/download/R_2_4_8/expat-2.4.8.tar.bz2 && \
    echo "a247a7f6bbb21cf2ca81ea4cbb916bfb9717ca523631675f99b3d4a5678dcd16  expat-2.4.8.tar.bz2" | sha256sum -c && \
    tar -xf expat-2.4.8.tar.bz2 && \
    rm expat-2.4.8.tar.bz2 && \
    cd expat-2.4.8 && \
    ./configure --enable-static --disable-shared --prefix=/usr && \
    make -j${NPROC:-$(nproc)} && \
    make -j${NPROC:-$(nproc)} install

# Build libunbound for static builds
WORKDIR /tmp
RUN set -ex && wget https://www.nlnetlabs.nl/downloads/unbound/unbound-1.16.1.tar.gz && \
    echo "2fe4762abccd564a0738d5d502f57ead273e681e92d50d7fba32d11103174e9a  unbound-1.16.1.tar.gz" | sha256sum -c && \
    tar -xzf unbound-1.16.1.tar.gz && \
    rm unbound-1.16.1.tar.gz && \
    cd unbound-1.16.1 && \
    ./configure --disable-shared --enable-static --without-pyunbound --with-libexpat=/usr --with-ssl=/usr --with-libevent=no --without-pythonmodule --disable-flto --with-pthreads --with-libunbound-only --with-pic && \
    make -j${NPROC:-$(nproc)} && \
    make -j${NPROC:-$(nproc)} install

# Switch to Monero source directory
WORKDIR /monero

COPY core_rpc_server.cpp.patch /tmp/core_rpc_server.cpp.patch

# Git pull Monero source at specified tag/branch and compile statically-linked monerod binary
RUN set -ex && git clone --recursive --branch ${MONERO_BRANCH} \
    --depth 1 --shallow-submodules \
    https://github.com/monero-project/monero . \
    && git apply /tmp/core_rpc_server.cpp.patch \
    && test `git rev-parse HEAD` = ${MONERO_COMMIT_HASH} || exit 1 \
    && case ${TARGETARCH:-amd64} in \
        "arm64") CMAKE_ARCH="armv8-a"; CMAKE_BUILD_TAG="linux-armv8" ;; \
        "amd64") CMAKE_ARCH="x86-64"; CMAKE_BUILD_TAG="linux-x64" ;; \
        *) echo "Dockerfile does not support this platform"; exit 1 ;; \
    esac \
    && mkdir -p build/release && cd build/release \
    && cmake -D ARCH=${CMAKE_ARCH} -D STATIC=ON -D BUILD_64=ON -D CMAKE_BUILD_TYPE=Release -D BUILD_TAG=${CMAKE_BUILD_TAG} ../.. \
    && cd /monero && nice -n 19 ionice -c2 -n7 make -j${NPROC:-$(nproc)} -C build/release daemon wallet_rpc_server simplewallet

# Begin final image build
# Select Alpine 3.x for the base image
FROM alpine:3.16

# Upgrade base image
RUN set -ex && apk --update --no-cache upgrade

# Install all dependencies for static binaries + curl for healthcheck
RUN set -ex && apk add --update --no-cache \
    curl \
    ca-certificates \
    libexecinfo \
    libsodium \
    ncurses-libs \
    pcsc-lite-libs \
    readline \
    tzdata \
    zeromq

# Add user and setup directories for monerod
RUN set -ex && adduser -Ds /bin/bash monero \
    && mkdir -p /home/monero/.bitmonero \
    && chown -R monero:monero /home/monero/.bitmonero

# Copy and enable entrypoint script
ADD entrypoint.sh /entrypoint.sh
RUN set -ex && chmod +x entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]

# Install and configure fixuid and switch to MONERO_USER
ARG MONERO_USER="monero"
ARG TARGETARCH
RUN set -ex && case ${TARGETARCH:-amd64} in \
        "arm64") curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.5.1/fixuid-0.5.1-linux-arm64.tar.gz | tar -C /usr/local/bin -xzf - ;; \
        "amd64") curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.5.1/fixuid-0.5.1-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - ;; \
        *) echo "Dockerfile does not support this platform"; exit 1 ;; \
    esac && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: ${MONERO_USER}\ngroup: ${MONERO_USER}\n" > /etc/fixuid/config.yml
USER "${MONERO_USER}:${MONERO_USER}"

# Switch to home directory and install newly built monerod binary
WORKDIR /home/${MONERO_USER}
COPY --chown=monero:monero --from=build \
    /monero/build/release/bin/monerod \
    /monero/build/release/bin/monero-wallet-rpc \
    /monero/build/release/bin/monero-wallet-cli \
    /usr/local/bin/

# Expose p2p port
EXPOSE 18080

# Expose restricted RPC port
EXPOSE 18089

# Add HEALTHCHECK against get_info endpoint
HEALTHCHECK --interval=30s --timeout=5s CMD curl --fail http://localhost:18081/get_info || exit 1

# Start monerod with sane defaults that are overridden by user input (if applicable)
CMD ["--rpc-restricted-bind-ip=0.0.0.0", "--rpc-restricted-bind-port=18089", "--no-igd", "--no-zmq", "--enable-dns-blocklist"]
