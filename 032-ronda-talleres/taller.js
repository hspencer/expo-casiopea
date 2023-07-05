/** a note is a note is a note  */

class Taller {
    constructor(result) {
        let margin = 200;
        this.x = random(margin, width - margin);
        this.y = random(margin, height - margin);
        this.carrerasRelacionadas = result['printouts']['Carreras_Relacionadas'];
        this.profesores = result['printouts']['Profesores'];
        this.alumnos = result['printouts']['Alumnos'];
        this.nombre = result.fulltext;//['printouts']['Asignaturas_Relacionadas'];
        this.angle = 0;

        this.w = textWidth(this.nombre) + 14;
        this.h = textAscent() + textDescent() + 7;

        let options = {
            friction: 0,
            restitution: 0.77,
            mass: this.w
        };
        this.body = Bodies.rectangle(this.x, this.y, this.w, this.h, options);
        World.add(world, this.body);
    }

    display() {
        // this.rollover(mouseX, mouseY);
        this.angle = this.body.angle;
        let pos = this.body.position;
        this.x = pos.x;
        this.y = pos.y;
        push();
        translate(pos.x, pos.y);
        rotate(this.angle);
            stroke(0, 20);
            if(this.body === mouseOverBody){
                fill("pink");
            }else{
                fill("white");
            }
            rect(0, 0, this.w, this.h, 3);
            fill(0);
            text(this.nombre, 0, -2);
            noFill();
        pop();
    }
}