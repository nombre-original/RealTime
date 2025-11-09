const ws = require("ws");

const PORT = process.env.PORT || 8080;

const server = new ws.WebSocketServer({ port: PORT }, ()=>{
    console.log("El servidor ha sido creado...");
});

//DATOS DEL JUEGO
var jugadores = new Map(); //guardo: indice=conexion, dato=datos del jugador
var siguienteId = 0;

var fruta = {
    idFruta: 0,
    posXFruta: Math.floor(Math.random() * 480),
    posYFruta: Math.floor(Math.random() * 480)
};

server.addListener("connection", (conexionJugador)=>{
    console.log("Alguien se ha conectado");

    //crear la fruta
    if (!fruta){
        fruta = {
            idFruta: 0,
            posXFruta: Math.floor(Math.random() * 480),
            posYFruta: Math.floor(Math.random() * 480)
        };
    }

    //crear un nuevo jugador
    datos = {
        id: siguienteId, 
        posX: Math.floor(Math.random()*480), 
        posY: Math.floor(Math.random()*480), 
        dir: "0",
        puntos: 0
    };
    siguienteId++;
    jugadores.set(conexionJugador, datos);

    //avisar a todos que hay alguien nuevo
    jugadores.forEach((d, c) =>{
        c.send(
            JSON.stringify({
                tipo: "new",
                datos: datos
            })
        );
        //avisar a todos de nueva fruta
        c.send(
            JSON.stringify({
                tipo: "fruta",
                datos: fruta
            })
        );
    });

    //avisar al nuevo de todos los jugadores que existian previamente
    jugadores.forEach((d,c)=>{
        if (c!=conexionJugador) { //solo del resto de jugadores, no de sí mismo
            conexionJugador.send(
                JSON.stringify({
                    tipo: "new",
                    datos: d
                })
            );
        }
    })

    conexionJugador.addEventListener("close", ()=>{
        console.log("Alguien se ha desconectado");
        //buscar quien se ha desconectado
        var datosDeQuienSeDesconecta = jugadores.get(conexionJugador);
        //eliminarlo de la lista
        jugadores.delete(conexionJugador);
        //avisar a los demas
        jugadores.forEach((d, c)=>{
            c.send(
                JSON.stringify({
                    tipo: "delete",
                    datos: datosDeQuienSeDesconecta.id
                })
            )
        });
    })

    conexionJugador.addEventListener("message", (m)=>{
        var mensaje = JSON.parse(m.data.toString());
        if (mensaje.tipo=="mover"){
            //var datosDelJugador = jugadores.get(conexionJugador);

            var datosDelJugador=mensaje.datos; //actualizo la informacion del jugador
            //var datosDelJugador = {id: recibido.id,posX: recibido.posX,posY: recibido.posY, puntos: 0};
            //console.log("Puntos: " + datosDelJugador.puntos);

            //guardar la info actualizada
            jugadores.set(conexionJugador, datosDelJugador);

            //FRUTA
            var f = fruta;
            //si están chocando, number convierte string en número
            if (Number(datosDelJugador.posX) > f.posXFruta - 20 &&
                Number(datosDelJugador.posX) < f.posXFruta + 20 &&
                Number(datosDelJugador.posY) > f.posYFruta - 20 &&
                Number(datosDelJugador.posY) < f.posYFruta + 20){
                    //para evitar el nan y el object object, convertir a número
                    if (datosDelJugador.puntos == undefined || isNaN(Number(datosDelJugador.puntos))) {
                          datosDelJugador.puntos = 0;
                    }else{
                        datosDelJugador.puntos = Number(datosDelJugador.puntos);
                    }
                    datosDelJugador.puntos = Number(datosDelJugador.puntos) + 1;
                    jugadores.set(conexionJugador, datosDelJugador);
                    f.posXFruta = Math.floor(Math.random() * 480);
                    f.posYFruta = Math.floor(Math.random() * 480);
                    //console.log("Puntos al comer: " + datosDelJugador.puntos);
            }

            //informar a todos
            jugadores.forEach((d,c)=>{
                c.send(JSON.stringify({
                    tipo:"mover",
                    datos:datosDelJugador
                }));
                //fruta
                c.send(JSON.stringify({
                    tipo: "fruta",
                    datos: f
                }));
            })
        }
    });
});
