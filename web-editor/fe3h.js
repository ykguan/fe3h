var characters = [
    "Byleth",
    "Edelgard",
    "Dimitri",
    "Claude",
    "Hubert",
    "Ferdinand",
    "Linhardt",
    "Caspar",
    "Bernadetta",
    "Dorothea",
    "Petra",
    "Dedue",
    "Felix",
    "Ashe",
    "Sylvain",
    "Mercedes",
    "Annette",
    "Ingrid",
    "Lorenz",
    "Raphael",
    "Ignatz",
    "Lysithea",
    "Marianne",
    "Hilda",
    "Leonie",
    "Seteth",
    "Flayn",
    "Hanneman",
    "Manuela",
    "Gilbert",
    "Alois",
    "Catherine",
    "Shamir",
    "Cyril"
];

var skills = [
    "Sword",
    "Lance",
    "Axe",
    "Bow",
    "Brawl",
    "Reason",
    "Faith",
    "Authority",
    "Heavy Armor",
    "Riding",
    "Flying"
];

var xpToLevel = [
    40,     // E
    60,     // E+
    80,     // D
    120,    // D+
    160,    // C    
    220,    // C+
    280,    // B    
    360,    // B+
    440,    // A
    760,    // A+
    1080    // S
];

var data;
var modified;

$(document).ready(function() {
    var c = $("#skills-xp");
    var th = $("<th></th>").attr("colspan", 2);
    for (var i = 0; i < skills.length; i++) {
        var newTh = th.clone();
        newTh.text(skills[i]);
        newTh.appendTo($("#title-row-1"));
        
        $("<th>Lv</th><th>XP</th>").appendTo($("#title-row-2"));
    }

    $("#fileinput").change(function() {
        var f = $(this).prop("files")[0];        
        
        if (f) {
            var r = new FileReader();
            
            r.onload = function() {
                data = new Uint8Array(r.result)
                modified = null;
                showData();
            }
            r.readAsArrayBuffer(f);            
        }
    });
    
    $("#maximize").click(function() {
        if (!data) {
            alert("save not loaded");
            return false;
        }
        
        // clone data
        modified = data.slice(0);
        
        for (var i = 0; i < characters.length; i++) {
            // check if character is recruited
            var flags = data[0x650 + i * 0x230 + 0xac];
            if (flags & 0b10) {
                for (var j = 0; j < skills.length; j++) {
                    var dLv = data[0x650 + i * 0x230 + 0x88 + j];
                    if (dLv > 10) continue;
                    var mXp = xpToLevel[dLv] - 1;
                    
                    modified[0x650 + i * 0x230 + 0x32 + 2 * j] = mXp & 0xff;
                    modified[0x650 + i * 0x230 + 0x32 + 2 * j + 1] = mXp >> 8;
                }
            }
        }
        
        showData();
        return false;
    });
    
    $("#save").click(function() {
        if (!modified) {
            alert("No modified data to save");
            return false;
        }
        
        var checksum = 0;
        for (var i = 0xc; i < modified.length; i++) {
            checksum += modified[i];
        }
        
        modified[3] = checksum >> 24;
        modified[2] = (checksum >> 16) & 0xff;
        modified[1] = (checksum >> 8) & 0xff;
        modified[0] = checksum & 0xff;
        
        /*
        var blob = new Blob([modified], {type: 'application/octet-stream'});
        var lk = window.URL.createObjectURL(blob);
        window.location = lk;
        */
        var fullPath = $("#fileinput").val();
        var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        var filename = fullPath.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
            filename = filename.substring(1);
        }
        saveData(modified, filename);
    });
    
    //stolen from https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var blob = new Blob([data], {type: "application/octet-stream"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());
});

function showData() {
    var c = $("#skills-xp");
    c.find("tr.character").remove();
    if (!data) return;
    var v = data; 
    
    for (var i = 0; i < characters.length; i++) {
        var str = '<tr class="character">' +
                  '  <td>' + characters[i] + '</td>';
        
        var flags = v[0x650 + i * 0x230 + 0xac];
        if (flags & 0b10) {
            str += "<td>Y</td>";
        } else {
            str += "<td>&nbsp;</td>";
        }
        
        for (var j = 0; j < skills.length; j++) {
            var dLv = v[0x650 + i * 0x230 + 0x88 + j];
            var dXp = v[0x650 + i * 0x230 + 0x32 + 2 * j] + (v[0x650 + i * 0x230 + 0x33 + 2 * j] << 8);
            
            str += '<td>' + dLv.toString() + "</td>";
            
            // draw in red if data is modified
            if (modified) {
                var mXp = modified[0x650 + i * 0x230 + 0x32 + 2 * j] + (modified[0x650 + i * 0x230 + 0x33 + 2 * j] << 8);
                if (mXp != dXp) {
                    str += '<td class="modified">';
                } else {
                    str += '<td>';
                }
                str += mXp.toString() + "</td>";
            } else {
                str += '<td>' + dXp.toString() + "</td>";
            }
        }
        
        str += "</tr>";
        
        c.append(str);
    }
}
