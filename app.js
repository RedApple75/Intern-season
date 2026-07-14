// companiesData is loaded from data.js

document.addEventListener('DOMContentLoaded', () => {
    // Show companies by default (exclude events)
    const initialCompanies = companiesData.filter(c => !c.is_event);
    renderCompanies(initialCompanies);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    const categoryBtns = document.querySelectorAll('.categories button');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterByCategory(e.target.dataset.cat);
        });
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('timelineView').classList.add('hidden');
        document.getElementById('companyList').classList.remove('hidden');
        document.querySelector('.categories').classList.remove('hidden');
    });
});

function renderCompanies(companies) {
    const list = document.getElementById('companyList');
    list.innerHTML = '';

    if (companies.length === 0) {
        list.innerHTML = '<p>No items found.</p>';
        return;
    }

    companies.forEach(company => {
        const card = document.createElement('div');
        card.className = 'company-card';
        if (company.is_event) {
            card.innerHTML = `
                <h3>${company.name}</h3>
                <div class="card-meta">
                    <span class="tag" style="border-color: #555; color: #aaa;">📢 PT Cell Event</span>
                </div>
                <p class="eligibility-info" style="color: #777;">General announcements, timelines, or guides.</p>
                <p style="margin-top: auto; padding-top: 0.5rem; font-size: 0.8rem; color: #777; border-top: 1px solid var(--border-color);">
                    ${company.timeline.length} update(s)
                </p>
            `;
        } else {
            const stipends = company.stipend.split(' | ');
            let stipendBadgesHtml = '';
            stipends.forEach(s => {
                if (s && s !== 'N/A') {
                    stipendBadgesHtml += `<span class="tag stipend-tag">💵 ${s}</span>`;
                }
            });
            if (!stipendBadgesHtml) {
                stipendBadgesHtml = `<span class="tag stipend-tag">💵 N/A</span>`;
            }

            card.innerHTML = `
                <h3>${company.name}</h3>
                <div class="card-meta">
                    <span class="tag">${company.category}</span>
                    ${stipendBadgesHtml}
                </div>
                <p class="eligibility-info">🎓 ${company.eligibility}</p>
                <p style="margin-top: auto; padding-top: 0.5rem; font-size: 0.8rem; color: #777; border-top: 1px solid var(--border-color);">
                    ${company.timeline.length} event(s)
                </p>
            `;
        }
        card.addEventListener('click', () => showTimeline(company));
        list.appendChild(card);
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const activeCatBtn = document.querySelector('.categories button.active');
    const cat = activeCatBtn ? activeCatBtn.dataset.cat : 'all';
    
    let filtered = companiesData;
    if (cat === 'all') {
        filtered = filtered.filter(c => !c.is_event);
    } else if (cat === 'PT Cell Event') {
        filtered = filtered.filter(c => c.is_event);
    } else {
        filtered = filtered.filter(c => c.category === cat && !c.is_event);
    }
    
    filtered = filtered.filter(c => c.name.toLowerCase().includes(query));
    renderCompanies(filtered);
}

function filterByCategory(cat) {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let filtered = companiesData;
    
    if (cat === 'all') {
        filtered = filtered.filter(c => !c.is_event);
    } else if (cat === 'PT Cell Event') {
        filtered = filtered.filter(c => c.is_event);
    } else {
        filtered = filtered.filter(c => c.category === cat && !c.is_event);
    }
    
    if (query) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(query));
    }
    
    renderCompanies(filtered);
}

function getProfilesHeaderHtml(company) {
    let html = `<span class="badge badge-cat">${company.category}</span>`;
    
    if (!company.profiles || company.profiles.length === 0) {
        html += `
            <span class="badge badge-stipend">💵 Stipend: N/A</span>
            <span class="badge badge-elig">🎓 Branches: N/A</span>
        `;
        return html;
    }
    
    // Stipend Badge
    const firstP = company.profiles[0];
    const allStipendsSame = company.profiles.every(p => p.stipend === firstP.stipend && p.stipend_inr === firstP.stipend_inr);
    
    let stipendText = "";
    if (allStipendsSame) {
        const stipendHtml = firstP.stipend_inr ? `${firstP.stipend} (${firstP.stipend_inr})` : firstP.stipend;
        stipendText = `Stipend: ${stipendHtml}`;
    } else {
        const mappings = company.profiles.map(p => {
            const stipendHtml = p.stipend_inr ? `${p.stipend} (${p.stipend_inr})` : p.stipend;
            return `${p.name}: ${stipendHtml}`;
        });
        stipendText = `Stipend: ${mappings.join(' | ')}`;
    }
    html += `<span class="badge badge-stipend">💵 ${stipendText}</span>`;
    
    // Eligibility Badge
    const allEligsSame = company.profiles.every(p => p.eligibility === firstP.eligibility);
    
    let eligText = "";
    if (allEligsSame) {
        eligText = `Branches: ${firstP.eligibility}`;
    } else {
        const mappings = company.profiles.map(p => `${p.name}: ${p.eligibility}`);
        eligText = `Branches: ${mappings.join(' | ')}`;
    }
    html += `<span class="badge badge-elig">🎓 ${eligText}</span>`;
    
    return html;
}

function detectColumnCount(tableCells) {
    if (tableCells.length < 2) return 1;
    
    // Match IITB roll number format: 2 digits followed by a letter (e.g., 23b3008, 24B0060)
    const rollNoRegex = /^\d{2}[a-zA-Z]/;
    
    let firstRollIdx = -1;
    for (let i = 0; i < tableCells.length; i++) {
        if (rollNoRegex.test(tableCells[i].trim())) {
            firstRollIdx = i;
            break;
        }
    }
    
    if (firstRollIdx === -1) {
        return 2; // Fallback default
    }
    
    // Find the header cell index that corresponds to the Roll Number column
    let rollHeaderIdx = 0;
    for (let i = 0; i < firstRollIdx; i++) {
        const val = tableCells[i].toLowerCase();
        if (val.includes('roll') || val.includes('id') || val.includes('ldap') || val.includes('number')) {
            rollHeaderIdx = i;
            break;
        }
    }
    
    const cols = firstRollIdx - rollHeaderIdx;
    if (cols > 0 && cols <= 8) {
        return cols;
    }
    
    if (firstRollIdx > 0 && firstRollIdx <= 8) {
        return firstRollIdx;
    }
    
    return 2;
}

function showTimeline(company) {
    document.getElementById('companyList').classList.add('hidden');
    document.querySelector('.categories').classList.add('hidden');
    document.getElementById('timelineView').classList.remove('hidden');
    
    document.getElementById('timelineCompanyName').innerHTML = `
        <div class="timeline-title-row">
            <span style="font-weight: bold; color: #fff; font-size: 2rem;">${company.name}</span>
            <div class="timeline-header-badges">
                ${getProfilesHeaderHtml(company)}
            </div>
        </div>
    `;
    
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';
    
    company.timeline.forEach(event => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        let contentHtml = '<div class="timeline-content"><ul>';
        event.contents.forEach(c => {
            contentHtml += `<li>${c}</li>`;
        });
        contentHtml += '</ul></div>';
        
        let tableHtml = '';
        if (event.tables && event.tables.length > 0) {
            const cols = detectColumnCount(event.tables);
            tableHtml = '<table class="timeline-table">';
            
            // Render Headers
            tableHtml += '<thead><tr>';
            for (let c = 0; c < cols; c++) {
                tableHtml += `<th>${event.tables[c] || ''}</th>`;
            }
            tableHtml += '</tr></thead><tbody>';
            
            // Render Rows
            for (let i = cols; i < event.tables.length; i += cols) {
                tableHtml += '<tr>';
                for (let c = 0; c < cols; c++) {
                    tableHtml += `<td>${event.tables[i + c] || ''}</td>`;
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table>';
        }

        let linkHtml = '';
        if (event.link) {
            linkHtml = `<a href="${event.link}" target="_blank" class="timeline-link">View External Link &rarr;</a>`;
        }
        
        item.innerHTML = `
            <h4>${event.type}</h4>
            <div class="timeline-date">${event.date}</div>
            ${event.contents.length > 0 ? contentHtml : ''}
            ${tableHtml}
            ${linkHtml}
        `;
        
        container.appendChild(item);
    });
}
