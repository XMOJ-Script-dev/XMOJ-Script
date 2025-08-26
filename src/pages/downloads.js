import { UtilityEnabled } from '../utils.js';

export function handleDownloadsPage() {
    let SoftwareList = document.querySelector("body > div > ul");
    SoftwareList.remove();
    SoftwareList = document.createElement("ul");
    SoftwareList.className = "software_list";
    let Container = document.createElement("div");
    document.querySelector("body > div").appendChild(Container);
    Container.className = "mt-3";
    Container.appendChild(SoftwareList);
    if (UtilityEnabled("NewDownload")) {
        let Softwares = [{
            "Name": "Bloodshed Dev-C++",
            "Image": "https://a.fsdn.com/allura/p/dev-cpp/icon",
            "URL": "https://sourceforge.net/projects/dev-cpp/"
        }, {
            "Name": "DevC++ 5.11 TDM-GCC 4.9.2",
            "Image": "https://www.xmoj.tech/image/devcpp.png",
            "URL": "https://www.xmoj.tech/downloads/Dev-Cpp+5.11+TDM-GCC+4.9.2+Setup.exe"
        }, {
            "Name": "Orwell Dev-C++",
            "Image": "https://a.fsdn.com/allura/p/orwelldevcpp/icon",
            "URL": "https://sourceforge.net/projects/orwelldevcpp/"
        }, {
            "Name": "Embarcadero Dev-C++",
            "Image": "https://a.fsdn.com/allura/s/embarcadero-dev-cpp/icon",
            "URL": "https://sourceforge.net/software/product/Embarcadero-Dev-Cpp/"
        }, {
            "Name": "RedPanda C++",
            "Image": "https://a.fsdn.com/allura/p/redpanda-cpp/icon",
            "URL": "https://sourceforge.net/projects/redpanda-cpp/"
        }, {
            "Name": "CP Editor",
            "Image": "https://a.fsdn.com/allura/mirror/cp-editor/icon?c35437565079e4135a985ba557ef2fdbe97de6bafb27aceafd76bc54490c26e3?&w=90",
            "URL": "https://cpeditor.org/zh/download/"
        }, {
            "Name": "CLion",
            "Image": "https://resources.jetbrains.com/storage/products/company/brand/logos/CLion_icon.png",
            "URL": "https://www.jetbrains.com/clion/download"
        }, {
            "Name": "CP Editor",
            "Image": "https://a.fsdn.com/allura/mirror/cp-editor/icon",
            "URL": "https://sourceforge.net/projects/cp-editor.mirror/"
        }, {
            "Name": "Code::Blocks",
            "Image": "https://a.fsdn.com/allura/p/codeblocks/icon",
            "URL": "https://sourceforge.net/projects/codeblocks/"
        }, {
            "Name": "Visual Studio Code",
            "Image": "https://code.visualstudio.com/favicon.ico",
            "URL": "https://code.visualstudio.com/Download"
        }, {
            "Name": "Lazarus",
            "Image": "https://a.fsdn.com/allura/p/lazarus/icon",
            "URL": "https://sourceforge.net/projects/lazarus/"
        }, {
            "Name": "Geany",
            "Image": "https://www.geany.org/static/img/geany.svg",
            "URL": "https://www.geany.org/download/releases/"
        }, {
            "Name": "NOI Linux",
            "Image": "https://www.noi.cn/upload/resources/image/2021/07/16/163780.jpg",
            "URL": "https://www.noi.cn/gynoi/jsgz/2021-07-16/732450.shtml"
        }, {
            "Name": "VirtualBox",
            "Image": "https://www.virtualbox.org/graphics/vbox_logo2_gradient.png",
            "URL": "https://www.virtualbox.org/wiki/Downloads"
        }, {
            "Name": "MinGW",
            "Image": "https://www.mingw-w64.org/logo.svg",
            "URL": "https://sourceforge.net/projects/mingw/"
        }];
        for (let i = 0; i < Softwares.length; i++) {
            SoftwareList.innerHTML += "<li class=\"software_item\">" + "<a href=\"" + Softwares[i].URL + "\">" + "<div class=\"item-info\">" + "<div class=\"item-img\">" + "<img height=\"50\" src=\"" + Softwares[i].Image + "\" alt=\"点击下载\">" + "</div>" + "<div class=\"item-txt\">" + Softwares[i].Name + "</div>" + "</div>" + "</a>" + "</li>";
        }
    }
}
