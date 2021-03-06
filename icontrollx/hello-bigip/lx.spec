Summary: F5 Basic iControlLX
Name: hello-bigip
Version: 0.0.7
Release: 0001
BuildArch: noarch
Group: Development/Libraries
License: Commercial
Packager: F5 Networks <support@f5.com>

%description
Basic iControlLX for getting started

%define APP_DIR /var/config/rest/iapps/%{name}

%prep
cp -r %{main}/src %{_builddir}/%{name}-%{version}

%build

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/%{APP_DIR}
cp -r $RPM_BUILD_DIR/%{name}-%{version}/* $RPM_BUILD_ROOT/%{APP_DIR}

%clean
rm -rf ${buildroot}

%files
%defattr(-,root,root)
%{APP_DIR}

%changelog
* Mon Apr 09 2018 iApp Dev <iappsdev@f5.com>
- auto-generated this spec file