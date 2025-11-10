// Tab değiştirme fonksiyonu
function showTab(tabName) {
    const sections = document.querySelectorAll('.calculator-section');
    const buttons = document.querySelectorAll('.tab-btn');
    
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// BMI Hesaplama
function hesaplaBMI() {
    const boy = parseFloat(document.getElementById('bmi-boy').value);
    const kilo = parseFloat(document.getElementById('bmi-kilo').value);
    const sonucDiv = document.getElementById('bmi-sonuc');
    
    if (!boy || !kilo || boy <= 0 || kilo <= 0) {
        sonucDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ Lütfen geçerli değerler girin!</p>';
        sonucDiv.classList.add('show');
        return;
    }
    
    const boyMetre = boy / 100;
    const bmi = (kilo / (boyMetre * boyMetre)).toFixed(1);
    
    let kategori, renk, tavsiye, emoji;
    
    if (bmi < 18.5) {
        kategori = 'Zayıf';
        renk = '#3498db';
        emoji = '📉';
        tavsiye = 'Sağlıklı kilo almak için dengeli beslenme önemli. Bir diyetisyene danışmanızı öneririm!';
    } else if (bmi >= 18.5 && bmi < 25) {
        kategori = 'Normal';
        renk = '#27ae60';
        emoji = '✅';
        tavsiye = 'Harika! Sağlıklı kilo aralığındasınız. Bu şekilde devam edin!';
    } else if (bmi >= 25 && bmi < 30) {
        kategori = 'Fazla Kilolu';
        renk = '#f39c12';
        emoji = '⚠️';
        tavsiye = 'Hafif kilolu aralığındasınız. Dengeli beslenme ve düzenli egzersiz faydalı olabilir.';
    } else {
        kategori = 'Obez';
        renk = '#e74c3c';
        emoji = '🔴';
        tavsiye = 'Sağlığınız için bir diyetisyen ve doktora danışmanızı şiddetle öneririm.';
    }
    
    sonucDiv.innerHTML = `
        <h3>${emoji} BMI Sonucunuz</h3>
        <p><strong>BMI Değeri:</strong> <span style="color: ${renk}; font-size: 1.5em;">${bmi}</span></p>
        <p><strong>Kategori:</strong> <span style="color: ${renk};">${kategori}</span></p>
        <p><strong>Tavsiye:</strong> ${tavsiye}</p>
        <p style="margin-top: 15px; font-size: 0.9em; color: #888;">
            <em>BMI Skalası: Zayıf (&lt;18.5) | Normal (18.5-24.9) | Fazla Kilolu (25-29.9) | Obez (≥30)</em>
        </p>
    `;
    sonucDiv.classList.add('show');
}

// Kalori Hesaplama (Mifflin-St Jeor Formülü)
function hesaplaKalori() {
    const cinsiyet = document.getElementById('kalori-cinsiyet').value;
    const yas = parseFloat(document.getElementById('kalori-yas').value);
    const boy = parseFloat(document.getElementById('kalori-boy').value);
    const kilo = parseFloat(document.getElementById('kalori-kilo').value);
    const aktivite = parseFloat(document.getElementById('kalori-aktivite').value);
    const sonucDiv = document.getElementById('kalori-sonuc');
    
    if (!yas || !boy || !kilo || yas <= 0 || boy <= 0 || kilo <= 0) {
        sonucDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ Lütfen tüm alanları geçerli değerlerle doldurun!</p>';
        sonucDiv.classList.add('show');
        return;
    }
    
    let bmr;
    if (cinsiyet === 'erkek') {
        bmr = (10 * kilo) + (6.25 * boy) - (5 * yas) + 5;
    } else {
        bmr = (10 * kilo) + (6.25 * boy) - (5 * yas) - 161;
    }
    
    const tdee = Math.round(bmr * aktivite);
    const kiloVerme = Math.round(tdee - 500);
    const kiloAlma = Math.round(tdee + 500);
    
    sonucDiv.innerHTML = `
        <h3>🔥 Kalori İhtiyacınız</h3>
        <p><strong>Bazal Metabolizma Hızı (BMR):</strong> ${Math.round(bmr)} kcal/gün</p>
        <p><strong>Günlük Kalori İhtiyacı (TDEE):</strong> <span style="color: #d4a574; font-size: 1.3em;">${tdee} kcal/gün</span></p>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p><strong>🎯 Hedefleriniz için:</strong></p>
        <p>📉 <strong>Kilo vermek için:</strong> ${kiloVerme} kcal/gün (günde 500 kcal açık)</p>
        <p>⚖️ <strong>Kilonuzu korumak için:</strong> ${tdee} kcal/gün</p>
        <p>📈 <strong>Kilo almak için:</strong> ${kiloAlma} kcal/gün (günde 500 kcal fazla)</p>
        <p style="margin-top: 15px; font-size: 0.9em; color: #888;">
            <em>Not: Bu değerler yaklaşık hesaplamalardır. Kişisel plan için diyetisyene danışın.</em>
        </p>
    `;
    sonucDiv.classList.add('show');
}

// İdeal Kilo Hesaplama (Devine Formülü)
function hesaplaIdealKilo() {
    const cinsiyet = document.getElementById('ideal-cinsiyet').value;
    const boy = parseFloat(document.getElementById('ideal-boy').value);
    const sonucDiv = document.getElementById('ideal-sonuc');
    
    if (!boy || boy <= 0 || boy < 140) {
        sonucDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ Lütfen geçerli bir boy değeri girin (140 cm üzeri)!</p>';
        sonucDiv.classList.add('show');
        return;
    }
    
    let idealKilo;
    const inchUzeri = (boy - 152.4) / 2.54;
    
    if (cinsiyet === 'erkek') {
        idealKilo = 50 + (2.3 * inchUzeri);
    } else {
        idealKilo = 45.5 + (2.3 * inchUzeri);
    }
    
    const minKilo = (idealKilo * 0.9).toFixed(1);
    const maxKilo = (idealKilo * 1.1).toFixed(1);
    idealKilo = idealKilo.toFixed(1);
    
    sonucDiv.innerHTML = `
        <h3>⚖️ İdeal Kilo Aralığınız</h3>
        <p><strong>İdeal Kilo:</strong> <span style="color: #d4a574; font-size: 1.5em;">${idealKilo} kg</span></p>
        <p><strong>Sağlıklı Kilo Aralığı:</strong> ${minKilo} - ${maxKilo} kg</p>
        <p style="margin-top: 15px;">
            Bu aralık, ${boy} cm boyunuz için Devine formülüne göre hesaplanmıştır. 
            Vücut yapınız, kas kütleniz ve diğer faktörler de önemlidir.
        </p>
        <p style="margin-top: 10px; font-size: 0.9em; color: #888;">
            <em>💡 İpucu: Sadece kiloya değil, vücut kompozisyonuna da dikkat edin!</em>
        </p>
    `;
    sonucDiv.classList.add('show');
}

// Su İhtiyacı Hesaplama
function hesaplaSu() {
    const kilo = parseFloat(document.getElementById('su-kilo').value);
    const aktivite = parseFloat(document.getElementById('su-aktivite').value);
    const sonucDiv = document.getElementById('su-sonuc');
    
    if (!kilo || kilo <= 0) {
        sonucDiv.innerHTML = '<p style="color: #e74c3c;">⚠️ Lütfen geçerli bir kilo değeri girin!</p>';
        sonucDiv.classList.add('show');
        return;
    }
    
    const suMl = Math.round(kilo * aktivite);
    const suLitre = (suMl / 1000).toFixed(1);
    const bardak = Math.round(suMl / 200);
    
    let aktiviteSeviye;
    if (aktivite === 30) {
        aktiviteSeviye = 'düşük aktivite';
    } else if (aktivite === 35) {
        aktiviteSeviye = 'orta aktivite';
    } else {
        aktiviteSeviye = 'yüksek aktivite';
    }
    
    sonucDiv.innerHTML = `
        <h3>💧 Günlük Su İhtiyacınız</h3>
        <p><strong>Toplam Su İhtiyacı:</strong> <span style="color: #3498db; font-size: 1.5em;">${suLitre} litre</span></p>
        <p><strong>Yaklaşık:</strong> ${suMl} ml veya ${bardak} bardak su (200ml)</p>
        <p style="margin-top: 15px;">
            ${kilo} kg kilonuz ve ${aktiviteSeviye} seviyeniz için önerilen günlük su miktarıdır.
        </p>
        <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
        <p><strong>💡 Su İçme İpuçları:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>Sabah kalktığınızda 1-2 bardak su için</li>
            <li>Her öğün öncesi 1 bardak su için</li>
            <li>Egzersiz sırasında ve sonrasında ekstra su için</li>
            <li>Susuzluk hissetmeden düzenli aralıklarla su için</li>
        </ul>
        <p style="margin-top: 15px; font-size: 0.9em; color: #888;">
            <em>Not: Hava sıcaklığı, hastalık durumu gibi faktörler su ihtiyacını artırabilir.</em>
        </p>
    `;
    sonucDiv.classList.add('show');
}

// Enter tuşu ile hesaplama
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const section = this.closest('.calculator-section');
                const button = section.querySelector('.calc-btn');
                if (button) button.click();
            }
        });
    });
});
