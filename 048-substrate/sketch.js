/*
// Substrate Watercolor
// j.tarbell. June, 2004
// Albuquerque, New Mexico
// complexification.net
*/


// Definición de variables globales
let dimx = 500;  // Ancho de la cuadrícula
let dimy = 500;  // Alto de la cuadrícula
let num = 0;  // Número actual de grietas
let maxnum = 150;  // Número máximo de grietas
let cgrid;  // Matriz que almacena las orientaciones de grietas en la cuadrícula
let cracks;  // Array de grietas
let maxpal = 512;  // Número máximo de colores permitidos en la paleta
let numpal = 0;  // Número actual de colores en la paleta
let goodcolor;  // Array para almacenar colores únicos
let sands;  // Variable para el pintor de arena (aún no se usa)

let colors = [
 
'#19160D','#323024','#B1B09E','#9E9D89','#1D1C0A','#110F00','#615E55','#0E0B04','#353128','#595549','#A39E8B','#96917B','#817B63','#938D77','#665F4F','#D0C8B5','#CEC3A7','#E2D5B2','#D6CAA4','#D9CDA7','#625737','#3C3217','#1F1605','#3A3024','#292011','#685E54','#5C5052','#524646','#D6CABA','#D6CCB3','#D8CEB3','#D3CBB4','#CDCABB','#CCC5B2','#BFAD89','#B7946C','#773A1D','#A96E50','#9D8058','#9F9065','#483A13','#5F5733','#393617','#3F3210','#835E32','#865A2B','#715321','#432C02','#443113','#78694C','#BEB089','#7A6D4D','#1F1412','#1F1015','#250F04','#4E2F1B','#784B34','#7F4321','#AF5F2E','#C25F1E','#D65F0F','#D75D07','#ED802E','#CE6718','#D56A1C','#CD5E0C','#D66306','#CB5D08','#C35E28','#A3502E','#90563E','#AB7954','#DFA156','#B47915','#BE9320','#B99C36','#5F4D0D','#64572B','#D3C49B','#635429','#9A8D60','#75683C','#81714D','#CAB892','#D0BE90','#CAB88A','#C7B591','#CAB797','#C7B698','#918167','#AC9B89','#C0AF9B','#D0C09F','#C8B692','#AE997C','#9F8D75','#6C5F4E','#524636','#635741','#4A3B26','#26140A','#4E3C2E','#847554','#7D6F4C','#261702','#473B25','#A59D76','#DDD6AC','#DCD5B9','#CFC8AE','#A79F7B','#A59F7D','#504B37','#111000','#1F2607','#63602D','#BB9E50','#CCA139','#D3A625','#CEA71C','#A98E09','#968102','#A68D17','#947A1D','#8C713A','#684E29','#534015','#423210','#180A00','#140508','#261120','#18020F','#130002','#170908','#060002','#0D090A','#4E4C3F','#44412E','#413C28','#DDD7C1','#322A15','#514A30','#D6D1B1','#968E6A','#907D5D','#756041','#A39274','#605333','#171100','#2E2909','#424034','#605E52','#7F7D70','#413F30','#0E0C00','#141205','#120E03','#171307','#4A4738','#75705D','#999480','#A29B88','#605947','#908979','#DCD4C1','#D0C5A9','#DACDAB','#E1D5AF','#AAA17A','#736A49','#443A21','#0E0500','#150C00','#170F00','#4F4734','#2F2420','#1E130F','#DDD3BA','#D6CCB1','#DBD3BC','#D9D2BF','#D5CDB8','#DBCCAD','#DCBE98','#A16742','#9C623C','#C0A377','#A19267','#2C2000','#312809','#332F16','#211300','#6C4824','#8D633B','#543811','#978362','#6D5D46','#8F806B','#453816','#160B00','#1F1410','#322628','#43322A','#442D1D','#5E3F2B','#2A0000','#8F4C22','#C46B31','#D26419','#CC5805','#CB5E0C','#CA5F11','#CB5B0F','#D46313','#CA5A06','#CE6A1F','#A15021','#642305','#441000','#814F2A','#9C6320','#B78127','#E6C053','#BDA038','#AC9549','#BCA96E','#B5A571','#B6A879','#7C6F42','#988B61','#AFA079','#C0B18A','#C6B58A','#DDCAA2','#DCC9A8','#C1AE90','#C7B796','#CEBFA0','#BCAC93','#D0C0A6','#D1C2A1','#CBBB99','#E1CEAE','#E3D2B8','#DDCEBB','#5A4D3C','#50442C','#30210C','#766458','#332113','#D6C7A8','#6C5F3D','#695A43','#82765C','#5A522B','#ABA47A','#ACA684','#817D5A','#5D5933','#B2AC88','#ACA589','#140E00','#343219','#39310A','#553D01','#9E7E2B','#B09127','#B4971F','#A9900F','#9B8201','#BFA129','#B59339','#806434','#765E3C','#8A7442','#635123','#2C1D06','#1A0902','#281214','#463033','#362422','#0C0100','#0A0408','#1E1A19','#312E1F','#5E5C45','#231F06','#605C43','#2F2D16','#524E35','#969174','#948B6A','#BCAD86','#C2B088','#C0B28F','#574C2C','#282202','#9E9979','#232416','#313125','#151209','#14110A','#120D07','#18140B','#646054','#211B0B','#0E0900','#27220E','#383320','#6B6555','#857F71','#181204','#534D3F','#E2DBC9','#D3C7AF','#E3D6B6','#CEC59C','#AEA57E','#8C8364','#40361D','#180F00','#474320','#221E00','#2C2512','#171000','#C4BEA6','#D6CFB5','#DFD3B9','#D0C4AA','#B8B099','#BAA685','#95612F','#7E470F','#CBAD79','#807146','#ACA181','#5C543F','#100700','#25120B','#6C4734','#4D2710','#422819','#39281E','#271C16','#473D33','#524630','#6F6450','#1C130C','#160E0C','#160E0B','#514A42','#251D10','#594733','#B38E73','#A36439','#BC5E1E','#D7691E','#D06215','#CC5B0D','#D65C11','#D35D15','#C9601E','#B66631','#562D11','#1F0000','#461A00','#7E4C27','#824E1E','#D5A865','#CAAB4E','#BBA037','#D7B450','#E5C36A','#D6C47C','#D4C88E','#BDB084','#D5C7A2','#E1D2AB','#E2D0AA','#EDD8B9','#EDD8BD','#E5CFB7','#CEBB9D','#BFAF8B','#B9AC82','#C0B28B','#B4A681','#E3D5B2','#D7C7A5','#D9C9A5','#E7D7B6','#D4C2AC','#756450','#2B1B01','#413118','#705E50','#1F0D00','#84765C','#A09373','#AA9C7F','#8E8461','#625A33','#B1AD80','#A09E6E','#4B4D1E','#272800','#9F9B75','#A69871','#433010','#291808','#433123','#5C4830','#1B0B00','#49420B','#615906','#B4A025','#CBAB24','#C69922','#9A6E17','#2D0C00','#492F14','#C3AB6B','#B59E58','#816E43','#291500','#412812','#624B3B','#342218','#0C0000','#0D0409','#282222','#7A745E','#7F7A5C','#353617','#2B3012','#050B00','#5B5F46','#86806A','#8F8466','#ABA26B','#CAC186','#C0B88A','#2B2501','#2B2606','#C4C1A2','#191A0C','#060600','#11100B','#464241','#262020','#2D2620','#666052','#605A44','#2B250B','#201A02','#544D3A','#352F1F','#635D51','#433C32','#1A1309','#A39B8E','#DACFBB','#D7CCB0','#C9BF9B','#BAB28D','#797053','#574F3A','#332A19','#655F47','#ACA97E','#6B683B','#B7B295','#1C1701','#BAB69D','#CEC8B0','#D9D2B8','#D7CEB1','#D5CBB2','#9C988C','#705E48','#9A6435','#92571F','#9D7B4B','#2F1D00','#3D331A','#5C5648','#1B1310','#1B0E08','#503426','#462919','#291009','#26130F','#291E1C','#352A24','#4A3D2D','#9D907F','#160C00','#332B28','#0A0702','#36382B','#969380','#8C7A64','#936A4A','#AD6733','#AA5715','#BD6A26','#D27A33','#C7621E','#BE5C1F','#A85428','#733619','#4C2F1D'
];


// Función de configuración
function setup(){
    goodcolor = new Array(maxpal);  // Inicializa el array de colores
    let cnv = createCanvas(500, 500, WEBGL);  // Crea un lienzo 3D de 500x500
    cnv.parent('p5');
    cnv.style('border-radius', '1ex');
    cnv.style('border', '1px solid #00000014');
    cnv.style('box-shadow', '0 0 7px #00000022');
    strokeWeight(0.5);
    translate(-width/2, -height/2);  // Ajusta el origen de coordenadas
    background(255);  // Fondo blanco
    takecolor();  // Extrae los colores de la imagen
    cgrid = processing2jsNewNumericArray(dimx * dimy);  // Inicializa la cuadrícula
    cracks = new Array(maxnum);  // Inicializa el array de grietas
    begin();  // Comienza el proceso de generación de grietas
}

// Función de dibujo, se ejecuta continuamente
function draw(){
    translate(-width/2, -height/2);  // Ajusta el origen de coordenadas
    for(let n = 0; n < num; n++) {
        cracks[n].move();  // Mueve cada grieta
    }
}

// Función que se ejecuta al presionar el mouse
function mousePressed(){
    begin();  // Reinicia el proceso de grietas al presionar el mouse
}

// Función que crea una nueva grieta
function makeCrack(){
    if(num < maxnum) {  // Si el número de grietas es menor al máximo permitido
        cracks[num] = new Crack();  // Crea una nueva grieta
        num++;  // Aumenta el contador de grietas
    }
}

// Función que inicializa la cuadrícula y las grietas
function begin(){
    // Inicializa la cuadrícula con valores grandes para simular espacios vacíos
    for(let y = 0; y < dimy; y++) {
        for(let x = 0; x < dimx; x++) {
            cgrid[y * dimx + x] = 10001;  // Valor alto para indicar que no hay grietas en ese punto
        }
    }

    // Establece algunos puntos iniciales con orientaciones aleatorias
    for(let k = 0; k < 16; k++) {
        let i = int(random(dimx * dimy - 1));  // Posición aleatoria
        cgrid[i] = int(random(360));  // Orientación aleatoria en grados
    }

    // Reinicia el número de grietas y crea unas pocas grietas iniciales
    num = 0;
    for(let k = 0; k < 3; k++) {
        makeCrack();  // Crea una grieta
    }

    background(255);  // Fondo blanco para reiniciar la visualización
}

// Función que devuelve un color aleatorio de la paleta extraída
function somecolor(){
    return goodcolor[int(random(numpal))];  // Devuelve un color aleatorio de goodcolor
}

// Función que toma los colores únicos de la imagen cargada
function takecolor(){
    // Inicializa el número de colores disponibles en el array de colores
    numpal = colors.length; 
    
    // Itera sobre el arreglo de colores y asigna cada color al array goodcolor
    for (let i = 0; i < numpal; i++) {
        goodcolor[i] = color(colors[i]);  // Convierte el color hexadecimal a formato color de p5.js
    }

    // Imprime todos los colores en formato hexadecimal
    for(let n = 0; n < numpal; n++) {
        print("#" + hex(goodcolor[n], 6) + ",");
    }
}


// Definición de la clase Crack (grieta)
class Crack{
    constructor(){
        this.x = 0;
        this.y = 0;
        this.t = 0;
        this.findStart();  // Encuentra el punto inicial de la grieta
        this.sp = new SandPainter();  // Inicializa el pintor de arena
    }

    // Encuentra un punto de inicio para la grieta
    findStart(){
        let px = 0;
        let py = 0;
        let found = false;
        let timeout = 0;

        // Bucle que busca un punto válido en la cuadrícula
        while((!found) || (timeout++ > 1000)){
            px = int(random(dimx));  // Coordenada x aleatoria
            py = int(random(dimy));  // Coordenada y aleatoria
            if(cgrid[py * dimx + px] < 10000) {  // Si hay una grieta cercana
                found = true;
            }
        }

        // Si se encuentra un punto válido, inicia la grieta
        if(found) {
            let a = cgrid[py * dimx + px];  // Toma la orientación de la cuadrícula
            if(random(100) < 50) {
                a -= 90 + int(random(-2, 2.1));  // Ajusta la dirección de la grieta
            } else {
                a += 90 + int(random(-2, 2.1));
            }
            this.startCrack(px, py, a);  // Comienza la grieta
        }
    }

    // Inicia la grieta en un punto y con una orientación
    startCrack(X, Y, T){
        this.x = X;
        this.y = Y;
        this.t = T;
        this.x += 0.61 * cos(this.t * PI / 180);  // Calcula la nueva posición de la grieta
        this.y += 0.61 * sin(this.t * PI / 180);
    }

    // Mueve la grieta y actualiza la cuadrícula
    move(){
        this.x += 0.62 * cos(this.t * PI / 180);  // Avanza en la dirección actual
        this.y += 0.62 * sin(this.t * PI / 180);
        let z = 0.33;
        let cx = int(this.x + random(-z, z));
        let cy = int(this.y + random(-z, z));

        this.regionColor();  // Asigna color a la región

        stroke(0, 85);  // Color de la grieta
        point(this.x + random(-z, z), this.y + random(-z, z));  // Dibuja la grieta

        // Verifica si la grieta se puede expandir en la cuadrícula
        if((cx >= 0) && (cx < dimx) && (cy >= 0) && (cy < dimy)) {
            if((cgrid[cy * dimx + cx] > 10000) || (abs(cgrid[cy * dimx + cx] - this.t) < 5)) {
                cgrid[cy * dimx + cx] = int(this.t);  // Actualiza la cuadrícula con la orientación de la grieta
            } else if(abs(cgrid[cy * dimx + cx] - this.t) > 2) {
                this.findStart();  // Busca un nuevo punto de inicio
                makeCrack();  // Crea una nueva grieta
            }
        } else {
            this.findStart();  // Busca un nuevo punto de inicio si se sale de los límites
            makeCrack();
        }
    }

    // Función que asigna color a la región que rodea la grieta
    regionColor(){
        let rx = this.x;
        let ry = this.y;
        let openspace = true;

        // Recorre el espacio alrededor de la grieta
        while(openspace){
            rx += 0.81 * sin(this.t * PI / 180);  // Avanza en la dirección del ángulo de la grieta
            ry -= 0.81 * cos(this.t * PI / 180);  // Avanza en la dirección perpendicular

            let cx = int(rx);  // Redondea la coordenada x
            let cy = int(ry);  // Redondea la coordenada y

            // Verifica si el punto actual está dentro de los límites de la cuadrícula
            if((cx >= 0) && (cx < dimx) && (cy >= 0) && (cy < dimy)) {
                if(cgrid[cy * dimx + cx] > 10000) {
                    // El espacio sigue abierto, continúa explorando
                } else {
                    openspace = false;  // Se encontró un límite, detener exploración
                }
            } else {
                openspace = false;  // Fuera de los límites de la cuadrícula
            }
        }

        // Llama al pintor de arena para dibujar la región
        this.sp.render(rx, ry, this.x, this.y);
    }

}

// Definición de la clase SandPainter (pintor de arena)
class SandPainter{
    constructor(){
        this.c = somecolor();  // Selecciona un color aleatorio de la paleta
        this.g = random(0.01, 0.1);  // Genera un valor aleatorio para el grosor de la pintura
    }

    // Función para dibujar la "arena" en la pantalla
    render(x, y, ox, oy){
        this.g += random(-0.050, 0.050);  // Ajusta ligeramente el grosor de la pintura
        let maxg = 1.0;

        // Limita el valor de g entre 0 y maxg
        if(this.g < 0) this.g = 0;
        if(this.g > maxg) this.g = maxg;

        let grains = 64;  // Número de "granos" de arena que se dibujarán
        let w = this.g / (grains - 1);  // Espaciado entre los granos

        // Bucle que dibuja cada grano de arena
        for(let i = 0; i < grains; i++) {
            let a = 0.1 - i / (grains * 19.0);  // Ajusta la transparencia
            stroke(red(this.c), green(this.c), blue(this.c), a * 256);  // Define el color y transparencia
            point(ox + (x - ox) * sin(sin(i * w)), oy + (y - oy) * sin(sin(i * w)));  // Dibuja el punto
        }
    }
}

// Función auxiliar que crea una matriz numérica
function processing2jsNewNumericArray(x){
    let arr = new Array(x);
    for (var i = 0; i < x; i++) {
        arr[i] = 0;  // Inicializa todos los valores a 0
    }
    return arr;  // Retorna la nueva matriz
}

