/**
 * PROXIMITY TEXT CHAT ADDON for Minecraft Bedrock Edition v1.20.10 lets your users chat only while in a fixed range from each other, 
 * and in the same dimension. Through commands you can set the distance. Note your members can still chat through commands such as
 * /me and /say.
 * 
 * To change the distance run this command in chat "esploratori:proximity_setup <proximity distance (number)> <use admin tag (true/false)>"
 * e.g. esploratori:proximity_setup 50 false
 * 
 * This addon was developed by InnateAlpaca of Esploratori-Development. You can reach us at:
 * - Discord: https://discord.gg/A2SDjxQshJ
 * - Github: https://github.com/InnateAlpaca
 * - Fiverr: https://www.fiverr.com/innatedeveloper
 * - Email: info@esploratori.space
 * More contacts at https://bedrockbridge.esploratori.space/Contact.html
 */

/** MIT License

Copyright (c) 2023 InnateAlpaca

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

- Mention the author of this pack inside the code and reference link https://github.com/InnateAlpaca.

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { world, DynamicPropertiesDefinition, system } from "@minecraft/server";
world.saveDynamicProperty=async function(name, value){
    system.run(()=>{
        this.setDynamicProperty(name, value);
    })
}

const options = {
    default_proximity_distance: 50,
    admin_tag: "proximity_admin",
    options_command: "esploratori:proximity_setup",
    deaf_message: true //let players know if their message was not received by anyone
}

var game_proximity_distance = options.default_proximity_distance;
var do_admin_tag = options.admin_tag;

world.afterEvents.worldInitialize.subscribe((e)=>{
    let chest_lock = new DynamicPropertiesDefinition();
    chest_lock.defineNumber("esploratori:proximity_distance", options.default_proximity_distance);
    chest_lock.defineBoolean("esploratori:do_admin_tag", false);
    e.propertyRegistry.registerWorldDynamicProperties(chest_lock);

    game_proximity_distance = world.getDynamicProperty("esploratori:proximity_distance");
    do_admin_tag = world.getDynamicProperty("esploratori:do_admin_tag")
    console.log(`Proximity distance started. Proximity distance is ${game_proximity_distance} blocks. Admin-lock enabled: ${do_admin_tag}`);
})

// Command handler
world.beforeEvents.chatSend.subscribe(e=>{
    if (e.message.startsWith(options.options_command)){
        e.cancel=true;

        if (world.getDynamicProperty("esploratori:do_admin_tag")&&!e.sender.hasTag(options.admin_tag)){
            e.sender.sendMessage("§cYou can't run this command as you are not a proximity_admin."); return;
        }
        
        const [proximity_distance, do_admin] = e.message.slice(options.options_command.length+1).split(' ');
        if (proximity_distance.length==0){
            e.sender.sendMessage(`Current proximty distance is: §o${game_proximity_distance} blocks.`); return;
        }
        if (Number.parseInt(proximity_distance)>0){
            game_proximity_distance=Number.parseInt(proximity_distance);
            world.saveDynamicProperty("esploratori:proximity_distance", game_proximity_distance);
        }
        else {
            e.sender.sendMessage("§cWrong arguments. Usage: §oesploratori:proximity_setup <proximity distance (number)> <use admin tag (true/false)>"); return;
        }
        
        if (do_admin){
            if (do_admin=="true"){
                do_admin_tag=true;
                world.saveDynamicProperty("esploratori:do_admin_tag", true);
            }
            else if (do_admin=="false"){
                do_admin_tag=false;
                world.saveDynamicProperty("esploratori:do_admin_tag", false);
            }
            else {
                e.sender.sendMessage("§cWrong arguments. Usage: §oesploratori:proximity_setup <proximity distance (number)> <use admin tag (true/false)>"); return;
            }
        }        
        e.sender.sendMessage("§eAll changes to proximity were executed");

    }
})

world.beforeEvents.chatSend.subscribe(e=>{
    const targets = e.sender.dimension.getPlayers({location: e.sender.location, maxDistance: game_proximity_distance});
    
    e.setTargets(targets)
    e.sendToTargets=true;

    if (targets.length==0 && options.deaf_message)
        e.sender.sendMessage("§iOther players are too far away, they can't hear you!")
})