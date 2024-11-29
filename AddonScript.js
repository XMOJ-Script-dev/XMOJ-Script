        function getRandomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        setInterval(function() {
            document.getElementById('colorText').style.color = getRandomColor();
        }, 500);
console.log("AddonScript.js has loaded.");
