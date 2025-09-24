
-- APEX[GG]v2
-- https://t.me/apexgg2Home
GAMESversion=5
print('---------------------------------------------------------------') 
print("APEX[GG]v2-(GAMES)-v05") 
print("https://t.me/apexgg2Home") 
gg.setVisible(false) 
INTERROR="× Internet Access Required ×\n\nIf error continues:\n  • Allow GG internet access\n  • Check internet connectivity.\n  • Try using a VPN.\n  • Servers might be down."
local linkapex=gg.alert("APEX[GG]v2\nhttps://t.me/apexgg2Home\n\nPlease notify me on telegram if you encounter any problems or if any script needs an update.\n\n× Scripts are not optimized for PC","ENTER","EXIT","COPY TEL LINK")
    if linkapex==2 then gg.setVisible(true) print("GOODBYE") os.exit() return end
    if linkapex==3 then 
        gg.copyText("https://t.me/apexgg2Home",false) 
        gg.toast("Link Copied\nhttps://t.me/apexgg2Home")
    end    
HackingIsTheGame=0
local APEXAPEX=gg.makeRequest("https://users.script-run.store/apex/HackingIsTheGame.lua").content 
    if APEXAPEX==nil then 
        gg.toast("×× ERROR ××") 
        gg.alert(INTERROR,"EXIT",nil,"APEX[GG]v2")
        print(INTERROR)
        gg.setVisible(true) 
        os.exit() 
        return 
    end 
gg.toast("Loading Script...") 
xpcall(load(APEXAPEX),1776)
    if HackingIsTheGame==0 then 
        gg.toast("×× ERROR ××") 
        gg.alert(INTERROR,"EXIT",nil,"APEX[GG]v2")
        print(INTERROR)
        gg.setVisible(true) 
        os.exit()
        return
    end  
local APEXAPEX=gg.makeRequest("https://users.script-run.store/apex/APEX[GG]v2-(GAMES-MENU)-v05.lua").content
    if APEXAPEX==nil then 
        gg.toast("×× ERROR ××") 
        gg.alert(INTERROR,"EXIT",nil,"APEX[GG]v2")
        print(INTERROR)
        gg.setVisible(true) 
        os.exit()
        return
    end  
    if not string.match(tostring(APEXAPEX),"apexgg2Home") then
        gg.toast("×× ERROR ××") 
        gg.alert("×× ERROR ××\nGAMES-MENU FILE ","EXIT",nil,"APEX[GG]V2") 
        print("×× ERROR GETTING GAMES-MENU FILE ××")
        gg.setVisible(true) 
        os.exit()
        return
    end  
ZSCRIPT=gg.getFile()
ZREM=ZSCRIPT:gsub('[^/]+$','')
pcall(load(APEXAPEX)) 

