FROM ubuntu

WORKDIR /root

RUN apt-get update
RUN apt-get install -y ruby-dev gcc make git-core rpm vim
RUN gem install fpm
RUN git config --global http.sslVerify false
RUN mkdir -p rpmbuild/BUILD
RUN mkdir -p rpmbuild/RPMS
RUN mkdir -p rpmbuild/SOURCES
RUN mkdir -p rpmbuild/SPECS
RUN mkdir -p rpmbuild/SRPMS

VOLUME /artifacts

COPY src/f5-iAppsLX-basic-pool/nodejs rpmbuild/BUILD/
COPY package.json rpmbuild/BUILD/

COPY SPEC/f5-iAppsLX-basic-pool.spec rpmbuild/SPECS/

WORKDIR /root/rpmbuild
