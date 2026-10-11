let currentLeft = 'p1';
let currentRight = 'p2';

function updatePanes(changedSide) {
    const leftSelect = document.getElementById('leftPaneSelect');
    const rightSelect = document.getElementById('rightPaneSelect');

    if (leftSelect.value === rightSelect.value) {
        if (changedSide === 'left') rightSelect.value = currentLeft;
        else leftSelect.value = currentRight;
    }
    currentLeft = leftSelect.value;
    currentRight = rightSelect.value;

    document.getElementById('pane_p1').style.display = 'none';
    document.getElementById('pane_p2').style.display = 'none';
    document.getElementById('pane_ref').style.display = 'none';

    const lPane = document.getElementById('pane_' + leftSelect.value);
    const rPane = document.getElementById('pane_' + rightSelect.value);

    lPane.style.display = 'block';
    lPane.style.order = 1;

    rPane.style.display = 'block';
    rPane.style.order = 2;
}

let lastProfession = ""; 

function getActiveSlotKey() {
    const slotSelect = document.getElementById('charSlotSelect');
    return slotSelect ? slotSelect.value : 'char1';
}

function saveCharacterSlot() {
    const slotKey = getActiveSlotKey();
    const charData = {};
    const query = '#pane_p1 input, #pane_p2 input, #pane_p1 select, #pane_p2 select, #pane_p1 textarea, #pane_p2 textarea';
    const inputs = document.querySelectorAll(query);

    inputs.forEach(el => {
        if (el.id && !['charSlotSelect', 'leftPaneSelect', 'rightPaneSelect', 'ref_categorySelect', 'backpack_notes'].includes(el.id)) {
            if (el.type === 'checkbox') charData[el.id] = el.checked;
            else charData[el.id] = el.value;
        }
    });

    localStorage.setItem('gritGrid_' + slotKey, JSON.stringify(charData));
    const slotName = document.getElementById('charSlotSelect').options[document.getElementById('charSlotSelect').selectedIndex].text;
    alert('Contractor dossier successfully saved to ' + slotName + '!');
}

function switchCharacterSlot() {
    const slotKey = getActiveSlotKey();
    const saved = localStorage.getItem('gritGrid_' + slotKey);
    const query = '#pane_p1 input, #pane_p2 input, #pane_p1 select, #pane_p2 select, #pane_p1 textarea, #pane_p2 textarea';
    const inputs = document.querySelectorAll(query);

    if (saved) {
        const charData = JSON.parse(saved);
        inputs.forEach(el => {
            if (charData[el.id] !== undefined) {
                if (el.type === 'checkbox') el.checked = charData[el.id];
                else el.value = charData[el.id];
            }
        });
    } else {
        inputs.forEach(el => {
            if (['charSlotSelect', 'leftPaneSelect', 'rightPaneSelect', 'ref_categorySelect', 'backpack_notes'].includes(el.id)) return;
            if (el.type === 'checkbox') el.checked = false;
            else if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else if (el.type === 'number') el.value = (el.id.startsWith('stat_')) ? '30' : '';
            else el.value = '';
        });
        document.getElementById('char_currHp').value = '8';
        document.getElementById('char_maxHp').value = '8';
        document.getElementById('inv_gold').value = '20';
    }

    const profSelect = document.getElementById('char_prof_select');
    lastProfession = profSelect ? profSelect.value : "";
    const customBox = document.getElementById('char_prof_custom');
    if (profSelect && profSelect.value === 'Custom') customBox.style.display = 'block';
    else if (customBox) customBox.style.display = 'none';

    toggleMasterBackpack();
    toggleGrimoireSize();
    calcSkills();
}

function createNewCharacterSlot() {
    if (confirm("Clear this slot permanently?")) {
        localStorage.removeItem('gritGrid_' + getActiveSlotKey());
        switchCharacterSlot();
        alert("Slot cleared!");
    }
}

function setAsActive() {
    const currentSlot = getActiveSlotKey();
    if (currentSlot === 'char1') return alert("Already Active!");
    if (confirm("Move to Active Contractor?")) {
        const savedData = localStorage.getItem('gritGrid_' + currentSlot);
        if (savedData) {
            localStorage.setItem('gritGrid_char1', savedData);
            localStorage.removeItem('gritGrid_' + currentSlot);
            document.getElementById('charSlotSelect').value = 'char1';
            switchCharacterSlot();
            alert("Now Active!");
        } else { alert("Save first!"); }
    }
}

function backupCharacter() {
    const currentSlot = getActiveSlotKey();
    if (['char2', 'char3', 'char4', 'char5'].includes(currentSlot)) return alert("Already in Backup!");
    if (confirm("Move to Backup Roster?")) {
        const savedData = localStorage.getItem('gritGrid_' + currentSlot);
        if (savedData) {
            let targetSlot = null;
            for (let i = 2; i <= 5; i++) {
                if (!localStorage.getItem('gritGrid_char' + i)) { targetSlot = 'char' + i; break; }
            }
            if (!targetSlot) return alert("Backup Roster full!");
            localStorage.setItem('gritGrid_' + targetSlot, savedData);
            localStorage.removeItem('gritGrid_' + currentSlot);
            switchCharacterSlot();
            alert("Moved to " + targetSlot + "!");
        } else { alert("Save first!"); }
    }
}

function archiveCharacter() {
    const currentSlot = getActiveSlotKey();
    if (['char8', 'char9', 'char10'].includes(currentSlot)) return alert("Already in Morgue!");
    if (confirm("Send to Morgue?")) {
        const savedData = localStorage.getItem('gritGrid_' + currentSlot);
        if (savedData) {
            let targetSlot = null;
            for (let i = 8; i <= 10; i++) {
                if (!localStorage.getItem('gritGrid_char' + i)) { targetSlot = 'char' + i; break; }
            }
            if (!targetSlot) return alert("Morgue full!");
            localStorage.setItem('gritGrid_' + targetSlot, savedData);
            localStorage.removeItem('gritGrid_' + currentSlot);
            switchCharacterSlot();
            alert("Moved to " + targetSlot + "!");
        } else { alert("Save first!"); }
    }
}

function autoFillProfession() {
    const profSelect = document.getElementById('char_prof_select');
    const customBox = document.getElementById('char_prof_custom');
    const newProf = profSelect.value;
    if (newProf === 'Custom') customBox.style.display = 'block';
    else { customBox.style.display = 'none'; customBox.value = ''; }

    const dict = {
        "Tunnel Miner": { bonuses: { cqc: 20, tra: 20, arm: 10 }, tool: "Iron Pick" },
        "Acolyte Expulsee": { bonuses: { res: 20, med: 20, fai: 10 }, tool: "Carved Symbol of the Stars" },
        "Borderland Deserter": { bonuses: { sne: 20, shi: 20, tra: 10 }, tool: "Hemp Rope (50 ft)" },
        "Grave Robber": { bonuses: { loc: 20, sne: 20, cqc: 10 }, tool: "Iron Grappling Hook" },
        "Disgraced Scribe": { bonuses: { scr: 20, arc: 20, med: 10 }, tool: "3 Empty Glass Vials" }
    };

    if (lastProfession && lastProfession !== "Custom" && dict[lastProfession]) {
        const oldData = dict[lastProfession];
        for (const [skillId, value] of Object.entries(oldData.bonuses)) {
            const input = document.getElementById('bon_' + skillId);
            if (input) input.value = Math.max(0, (parseInt(input.value) || 0) - value);
        }
        for (let i = 1; i <= 12; i++) {
            const invSlot = document.getElementById('inv_s' + i);
            if (invSlot && invSlot.value === oldData.tool) { invSlot.value = ""; break; }
        }
    }

    if (newProf && newProf !== "Custom" && dict[newProf]) {
        const newData = dict[newProf];
        for (const [skillId, value] of Object.entries(newData.bonuses)) {
            const input = document.getElementById('bon_' + skillId);
            if (input) input.value = (parseInt(input.value) || 0) + value;
        }
        for (let i = 1; i <= 12; i++) {
            const invSlot = document.getElementById('inv_s' + i);
            if (invSlot && invSlot.value.trim() === "") { invSlot.value = newData.tool; break; }
        }
    }
    lastProfession = newProf;
    calcSkills();
}

function updateBackpackNotes() {
    const a1 = document.getElementById('inv_attach1').value;
    const a2 = document.getElementById('inv_attach2').value;
    const notesBox = document.getElementById('backpack_notes');
    const bpDict = {
        "Exterior Cargo Loops": "Adds 4 exterior lash-points. Inaccessible in combat.",
        "Sconce Rig": "Hands-free 360 light. Ruins stealth.",
        "Iron-Plate Baffle": "Absorbs rear hits (-1 slot Wear Tax).",
        "Oiled-Hide Water-Seal": "Protects against slime/rot.",
        "Quiver-Latch": "Carry heavy secondary.",
        "Apothecary Tray": "Prevents vials shattering (-2 slots).",
        "Bedroll & Camp Sling": "Shifts center of gravity.",
        "Drop-Away Release": "Instantly drop pack.",
        "Signal-Bell": "Camp tripwire alarm.",
        "Scavenger Hook": "Keeps harvest clean."
    };
    let result = "";
    if (a1 !== "None" && bpDict[a1]) result += "1. " + bpDict[a1] + "\n";
    if (a2 !== "None" && bpDict[a2]) result += "2. " + bpDict[a2] + "\n";
    if (notesBox) notesBox.value = result.trim();
}

function toggleMasterBackpack() {
    const bp = document.getElementById('inv_backpack');
    const menu = document.getElementById('masterBackpackAttachments');
    if (bp && menu) {
        menu.style.display = (bp.value === 'Master') ? 'block' : 'none';
        if (bp.value === 'Master') updateBackpackNotes();
    }
}

function toggleGrimoireSize() {
    const type = document.getElementById('grimoire_type');
    if (!type) return;
    for (let i = 11; i <= 30; i++) {
        const row = document.getElementById('grim_row_' + i);
        if (row) row.style.display = (type.value === '30') ? 'table-row' : 'none';
    }
}

function calcSkills() {
    const getVal = (id) => { const el = document.getElementById(id); return el ? parseInt(el.value) || 0 : 0; };
    const str = getVal('stat_str'), dex = getVal('stat_dex'), int = getVal('stat_int');
    const wis = getVal('stat_wis'), con = getVal('stat_con'), cha = getVal('stat_cha');

    const skills = [
        { id: 'cqc', stat: str }, { id: 'shi', stat: dex }, { id: 'arm', stat: con }, { id: 'ran', stat: dex },
        { id: 'fai', stat: str }, { id: 'med', stat: int }, { id: 'res', stat: wis }, { id: 'voi', stat: int },
        { id: 'tra', stat: wis }, { id: 'loc', stat: dex }, { id: 'sne', stat: dex }, { id: 'trk', stat: wis },
        { id: 'arc', stat: wis }, { id: 'scr', stat: int }, { id: 'stf', stat: dex }, { id: 'app', stat: int }
    ];

    skills.forEach(sk => {
        const baseSpan = document.getElementById(`b_${sk.id}`);
        const totalSpan = document.getElementById(`t_${sk.id}`);
        const bonusInput = getVal(`bon_${sk.id}`);
        if (baseSpan && totalSpan) {
            baseSpan.innerText = sk.stat;
            totalSpan.innerText = Math.min(80, sk.stat + bonusInput);
        }
    });
}

function rollDice(type) {
    let result = 0;
    if (type === 'd100') result = Math.floor(Math.random() * 100) + 1;
    if (type === 'd10') result = Math.floor(Math.random() * 10) + 1;
    const units = result % 10;
    const output = document.getElementById('desktop_dice_result');
    if (output) output.innerText = `${type}: ${result} (Units: ${units})`;
}

function showRefCategory() {
    const cat = document.getElementById('ref_categorySelect');
    if (!cat) return;
    const container = document.getElementById('store_container');
    if (!container) return;
    let html = '';

    if (cat.value === 'glossary') {
        html = `<table class="store-table"><tr><th>Rule</th><th>Definition</th></tr><tr><td><b>Wear Tax</b></td><td>Units digit 2, 3, or 4 on hit = Weapon Notch (-1 Dmg).</td></tr></table>`;
    } else if (cat.value === 'melee') {
        html = `<table class="store-table"><tr><th>Weapon</th><th>Max Dmg</th></tr><tr><td>Shortsword</td><td>6</td></tr><tr><td>Battleaxe</td><td>8</td></tr></table>`;
    }
    container.innerHTML = html;
}

window.addEventListener('DOMContentLoaded', () => {
    switchCharacterSlot();
    updatePanes('none');
    showRefCategory();
});
