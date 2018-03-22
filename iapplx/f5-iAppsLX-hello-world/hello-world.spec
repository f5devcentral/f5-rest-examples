Summary: Hello World iApp
Name: hello-world
Version: 0.1.0
Release: 0001
BuildArch: noarch
Group: Development/Libraries
License: Commercial
Packager: F5 Networks <support@f5.com>

%description
Sample iApp with a template file and configuration processor

%define IAPP_NAME %{name}
%define IAPP_DIR /var/config/rest/iapps/%{IAPP_NAME}

%prep
%setup -c -T
cp -r %{_topdir}/src .
 
%build
%{_topdir}/node_modules/jshint/bin/jshint src/**

%install
rm -rf $RPM_BUILD_ROOT

# main install dirs
mkdir -p $RPM_BUILD_ROOT%{IAPP_DIR}

# hello-world src
cp  -a src/*.json $RPM_BUILD_ROOT%{IAPP_DIR}
cp  -a src/nodejs $RPM_BUILD_ROOT%{IAPP_DIR}
cp  -a src/presentation $RPM_BUILD_ROOT%{IAPP_DIR}

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,restnoded,restnoded)
%{IAPP_DIR}

%changelog
* Thu Mar 03 2016 iApp Dev <iappsdev@f5.com>
- Initial version
