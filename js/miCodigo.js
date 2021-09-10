/******************************
 * Inicialización
 ******************************/

// Inicializamos Onsen UI y el Event Listener de Cordova

ons.ready(todoCargado);
document.addEventListener("deviceready", onDeviceReady, false);

function todoCargado() {
    myNavigator = document.querySelector('#myNavigator');
    spinnerModal = document.querySelector("#spinnerModal");
    //guardo token de localstorage
    tokenGuardado = localStorage.getItem('Token');

    if (localStorage.getItem('Favoritos') == null) {
        localStorage.setItem("Favoritos", []);
    }
    //si hay un token guardado va al home
    if (tokenGuardado != null) {
        iniciarSesion(null);
        showLoadingModal();
        myNavigator.pushPage('tabbarHome.html');

    }
}

function onDeviceReady() {

}

function prepareCallback(err, status) {
    if (err) {
        // En caso de cualquier tipo de error.
        ons.notification.alert(JSON.stringify(err));
    }
    if (status.authorized) {
        // Tenemos acceso y el escaner está inicializado.
    } else if (status.denied) {
        // El usuario rechazó el pedido, la pantalla queda en negro.
        ons.notification.alert('status.denied');
        // Podemos volver a preguntar mandando al usuario a la configuración de permisos con QRScanner.openSettings().
    } else {
        // Nos rechazaron solo por esta vez. Podríamos volver a hacer el pedido.
    }
}

/* Variables Globales */

let myNavigator;
let spinnerModal;
//api
const urlBase = 'https://ort-tallermoviles.herokuapp.com/api/';
const urlImg = 'https://ort-tallermoviles.herokuapp.com/assets/imgs/'
    //session
let usuarioLogueado;
let tokenGuardado;
//productos
let productos;
let busqueda = "";

//compra
let totalPedido;
let cantidadUsuario;

let totalProductos = [];
let totalEtiquetas = [];
let pedido = [];

//mapa
let miMapa;
let posicionDelUsuario;

//favoritos
let favsUsuario = [];
let listaFavsHtml = "";

//pedidos
let listaPedidosHtml = "";

/* Navegación */

// Función navegar principal

function navegar(paginaDestino, resetStack, bringPageTop, datos) {
    if (resetStack) {
        myNavigator.resetToPage(`${paginaDestino}.html`);
    } else if (!bringPageTop) {
        myNavigator.pushPage(`${paginaDestino}.html`, { data: datos });
    } else {
        myNavigator.bringPageTop(`${paginaDestino}.html`, { data: datos });
    }
    cerrarMenu();
}

// Función para volver atrás (popPage)

function volver() {
    myNavigator.popPage();
    cerrarMenu();
}

// Función logout

function cerrarSesion() {
    localStorage.removeItem('Token');
    navegar('login', true, true);
}

// Función que me lleva a la pantalla de escaneo.
function escanearQR() {
    navegar('escaneo', false, false);
}


/* Home */

function homeOnInit() {
    //se queria mostrar los productos destacados, tuvimos problemas con el array de productos
    if (totalProductos.data) {
        totalProductos.data.sort(function(a, b) {
            if (a.puntaje > b.puntaje) {
                return 1;
            }
            if (a.puntaje < b.puntaje) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
    }

    $.ajax({
        type: "GET",
        url: urlBase + 'productos/',
        contentType: "application/json",
        headers: {
            "x-auth": tokenGuardado,
        },
        success: obtenerTodosLosProductos,
        error: errorCallback
    });

    function obtenerTodosLosProductos(productos) {
        let productosMostrar = [];
        productosMostrar[0] = productos.data[0];
        productosMostrar[1] = productos.data[1];
        productosMostrar[2] = productos.data[2];
        productosMostrar[3] = productos.data[3];
        productosMostrar[4] = productos.data[4];
        let productosHtml = "";


        productosMostrar.forEach(function(producto) {

            let prodData = {
                _id: producto._id,
            }

            let prodJSON = JSON.stringify(prodData);

            productosHtml += `<ons-card onclick='navegar("detalleProducto", false, false, ${prodJSON})'>
            <img src=${urlImg + producto.urlImagen}.jpg alt='${producto.nombre}' style='width: 100%'>
            <div class='content'>
            <div class='title'>
            ${producto.nombre}
            </div>
            <div class='tarjetaContent'>
            
        
            <div class='tarjetaContent'>
              <span>$${producto.precio}</span><br>
              <span>${producto.codigo}</span>
            </div>
            </div>
            </div>
          </ons-card>`
        });
        $(".destacados .tarjetasProductos").html(productosHtml);
    }




}


/* Login */

function loginIniciarSesionHandler() {
    $("#msjLogin").html('');

    let emailIngresado = $("#nombreLogin").val();
    let passwordIngresado = $("#passwordLogin").val();

    //validar campos ingresados por el usuario
    if (validarPass(passwordIngresado) && validarEmail(emailIngresado)) {
        const datosUsuario = {
            email: emailIngresado,
            password: passwordIngresado
        };
        // consulta ajax para iniciar sesión de usuario
        $.ajax({
            type: 'POST',
            url: urlBase + 'usuarios/session',
            contentType: "application/json",
            data: JSON.stringify(datosUsuario),
            beforeSend: showLoadingModal,
            success: iniciarSesion,
            error: errorCallback
        })
    } else {
        //mensaje de error
        $("#msjLogin").html('Datos incorrectos, intente nuevamente.');
    }
}

function iniciarSesion(dataUsuario) {
    if (dataUsuario != null) {
        tokenGuardado = dataUsuario.data.token;
        localStorage.setItem("Token", tokenGuardado);
    }
    // consulta ajax para obtener _id
    $.ajax({
        type: 'GET',
        url: urlBase + 'usuarios/session',
        headers: {
            "x-auth": tokenGuardado
        },
        contentType: "application/json",
        // data: JSON.stringify(datosUsuario),
        beforeSend: showLoadingModal,
        success: guardarId,
        complete: hideLoadingModal,
        error: errorCallback
    })

    function guardarId(dataUsuarioId) {


        usuarioLogueado = new Usuario(dataUsuarioId.data._id, dataUsuarioId.data.nombre, dataUsuarioId.data.apellido, dataUsuarioId.data.email, dataUsuarioId.data.direccion, null);
        $("#saludo").html("Hola, " + dataUsuarioId.data.nombre);
        navegar('tabbarHome', true, true);
    }

    //login ok, va al tabbar
}


/* Registro */

function registroRegistrarseHandler() {
    $("#msjRegistro").html("");

    let nombreIngresado = $("#nombreRegistro").val();
    let apellidoIngresado = $("#apellidoRegistro").val();
    let direccionIngresada = $("#direccionRegistro").val();
    let emailIngresado = $("#mailRegistro").val();
    let passwordIngresado = $("#passwordRegistro").val();

    // validar campos ingresados por el usuario

    if (validarCampo(nombreIngresado) && validarCampo(apellidoIngresado) && validarCampo(direccionIngresada) && validarPass(passwordIngresado) && validarEmail(emailIngresado)) {

        const datosUsuario = {
            nombre: nombreIngresado,
            apellido: apellidoIngresado,
            email: emailIngresado,
            direccion: direccionIngresada,
            password: passwordIngresado
        };

        // consulta ajax POST para efectuar el registro

        $.ajax({
            type: 'POST',
            url: urlBase + 'usuarios',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(datosUsuario),
            beforeSend: showLoadingModal,
            success: registroCorrecto,
            complete: hideLoadingModal,
            error: errorCallback
        });
    } else {
        // mensaje de error
        $("#msjRegistro").html('Verifique sus datos.');
    }
}

// Notificación toast para registro OK

function registroCorrecto(resp) {
    ons.notification.toast("Registro correcto.", { timeout: 1500 });
    navegar('login', true, true);
}



/* Productos */

function productosOnInit(param) {

    // consulta ajax para listar productos al inicio
    $.ajax({
        type: 'GET',
        headers: {
            "x-auth": tokenGuardado,

        },
        url: urlBase + 'productos',
        contentType: 'application/json',
        beforeSend: showLoadingModal,
        success: listarProductos,
        complete: hideLoadingModal,
        error: errorCallback
    });
}

function productosOnShow() {
    if (myNavigator.topPage.data && myNavigator.topPage.data.scanText) {
        $.ajax({
            type: "GET",
            url: myNavigator.topPage.data.scanText,
            contentType: "application/json",
            headers: {
                "x-auth": tokenGuardado,
            },
            beforeSend: showLoadingModal,
            success: obtenerProductoEscaneado,
            complete: hideLoadingModal,
            error: errorCallback
        });
    }

    function obtenerProductoEscaneado(responseBody) {
        myNavigator.topPage.data = [];
        listarProductos(responseBody);
    }


    $("#productos .listadoProductos").html(productos);
    let favoritosLocalStorage = window.localStorage.getItem("Favoritos");
    let favObj
    if (favoritosLocalStorage != "") {

        favObj = jQuery.parseJSON(favoritosLocalStorage);
    } else {
        favObj = null;
    }
    if (favObj != null) {
        favObj.forEach(function(producto) {
            if (producto.usuario == usuarioLogueado._id) {
                $('.' + producto._id + ' .favItem').html("<ons-icon icon='fa-heart'></ons-icon>");
            }
        });
    }
}

function buscarProductos(key) {
    // tomamos el parámetro de búsqueda y hacemos una consulta ajax para su búsqueda por código.
    busqueda = key.toUpperCase();
    $.ajax({
        type: 'GET',
        headers: {
            "x-auth": tokenGuardado,

        },
        url: urlBase + 'productos' + '?codigo=' + busqueda,
        contentType: 'application/json',
        beforeSend: showLoadingModal,
        success: listarProductosCodigo,
        complete: hideLoadingModal,
        error: errorCallback
    });
}

function listarProductosCodigo(productosApiCodigo) {

    // se chequea que el parámetro ingresado en búsqueda exista como código,

    if (productosApiCodigo.data.length <= 0) {

        // en caso de no arrojar resultados se busca por etiquetas
        // verificamos que el parámetro ingresado en la búsqueda exista en las etiquetas
        console.log(totalEtiquetas);
        console.log(busqueda);
        if (totalEtiquetas.includes(busqueda.toLowerCase())) {
            $.ajax({
                type: 'GET',
                headers: {
                    "x-auth": tokenGuardado,
                },
                url: urlBase + 'productos',
                contentType: 'application/json',
                beforeSend: showLoadingModal,
                success: listarProductosEtiquetas,
                complete: hideLoadingModal,
                error: errorCallback
            });

            function listarProductosEtiquetas(key) {
                //llamar a listar producto con los productos contenidos
                let productosEtiquetas = [];
                productosEtiquetas.data = [];
                //recorre array general con todos los productos y guarda en uno nuevo los que contengan la etiqueta
                // /profe SE CORRIGE BUSQUEDA X ETIQUETA
                key.data.forEach(function(producto) {
                    producto.etiquetas.forEach(function(etiqueta) {
                        if (etiqueta.toUpperCase() == busqueda) {
                            producto.urlImg = producto.urlImagen;
                            productosEtiquetas.data.push(producto);
                        }
                    })
                });
                listarProductos(productosEtiquetas);
            }
        } else {
            // en caso de no arrojar resultados se busca por nombre
            $.ajax({
                type: 'GET',
                headers: {
                    "x-auth": tokenGuardado,

                },
                url: urlBase + 'productos' + '?nombre=' + busqueda,
                contentType: 'application/json',
                beforeSend: showLoadingModal,
                success: listarProductos,
                complete: hideLoadingModal,
                error: errorCallback
            });
        }
    } else {

        listarProductos(productosApiCodigo);
    }
}


function listarProductos(productosApi) {
    productos = "";
    if (productosApi.data == "" || productosApi.data == null || productosApi.data == undefined) {
        ons.notification.toast("No hay resultados para su solicitud", {
            timeout: 1500,
            animation: 'default'
        });
        productos = "<span class='container'>Sin resultados</span>";
        hideLoadingModal();
    }



    if (totalProductos.length == 0) {

        totalProductos.length = 0;
        totalProductos.data = [];
        productosApi.data.forEach(function(producto) {

            showLoadingModal();
            $.ajax({
                type: "GET",
                url: urlBase + 'productos/' + producto._id,
                contentType: "application/json",
                headers: {
                    "x-auth": tokenGuardado,
                },
                success: obtenerPuntaje,
                error: errorCallback
            });


            function obtenerPuntaje(responseBody) {
                let puntaje = responseBody.data.puntaje;
                let prod = {
                    _id: producto._id,
                    nombre: producto.nombre,
                    etiquetas: producto.etiquetas,
                    precio: producto.precio,
                    estado: producto.estado,
                    urlImagen: producto.urlImagen,
                    codigo: producto.codigo,
                    puntaje: puntaje
                }
                totalProductos.data.push(prod);
            }


        });
    }

    // recorremos la lista de productos.
    productosApi.data.forEach(function(producto) {


        //recorremos la lista de etiquetas por producto
        let etiquetas = "";

        producto.etiquetas.forEach(function(etiqueta) {
            // las generamos y las agregamos a un div etiquetas
            etiquetas += `<span>${etiqueta}</span>`

            // también agregamos estas etiquetas a un array global
            if (!totalEtiquetas.includes(etiqueta)) {
                totalEtiquetas.push(etiqueta);
            }
        });

        const prodListado = {
            _id: producto._id,
            nombre: producto._id,
            precio: producto._id,
            codigo: producto._id,
            estado: producto._id,
            urlImagen: producto._id
        }

        const prodData = {
            _id: producto._id,
        }

        let prodJSON = JSON.stringify(prodData);
        // generamos la vista de la lista de productos.
        productos += `<ons-list-item class='${producto._id}' modifier='chevron' tappable onclick='navegar("detalleProducto", false, false, ${prodJSON})'>
            <div class='left'>
            <img class='list-item__thumbnail' src=${urlImg + producto.urlImagen}.jpg>
            </div>
            <div class='center'>
                <span class='list-item__title'>
                <span class="nombre">${producto.nombre}</span>
                    <div class="precioFavs">
                        <span class="precio">$${producto.precio}</span>
                        <span class="favItem"></span>
                    </div>
                </span>
                <span class='list-item__subtitle'>
                <span class="codigo">${producto.codigo}</span>
                <span class="estado ${producto.estado.replace(' ', '-')}">${producto.estado}</span>
                
                </span>
                <span class="etiquetas">${etiquetas}</span>
            </div>
            <div class='right'>
            
            </div>
            </ons-list-item>`;
    });


    // limpiamos campo y lo rellenamos con la vista generada previamente.
    $("#productos .listadoProductos").html("");
    $("#productos .listadoProductos").html(productos);
    productosOnShow();
}


/* Detalles */

function detalleOnInit() {
    // consulta ajax para listar productos al inicio
    $.ajax({
        type: 'GET',
        headers: {
            "x-auth": tokenGuardado,

        },
        url: urlBase + 'productos/' + myNavigator.topPage.data._id,
        contentType: 'application/json',
        beforeSend: showLoadingModal,
        success: obtenerDetalleProducto,
        complete: hideLoadingModal,
        error: errorCallback
    });

    function obtenerDetalleProducto(detalleProducto) {
        totalPedido = 0;
        let producto = detalleProducto.data;
        cantidadUsuario = 0;

        // generamos la vista de la lista de productos.
        $("#detalleProducto ons-card").html(`
        <img style='width:100%;' src=${urlImg + producto.urlImagen}.jpg>
        <div class='codigo'>${producto.codigo}</div>
        <div class='title'>
        ${producto.nombre}
        </div>
        <div class='content'>
        <div class='stockPuntaje'>
            <div class='estado ${producto.estado.replace(' ', '-')}'>
            ${producto.estado}
            </div>
            <div class='puntaje'>
            </div>
        </div>
        <div class='precioFavorito'>
            <div class='precio'>$${producto.precio} <span>(${producto.descripcion})</span></div>
            <div class='favs'>
                <ons-button class='iconoFav' onclick='guardarFavoritoHandler(${JSON.stringify(producto)})'><ons-icon icon='fa-heart'></ons-icon></ons-button>
                <ons-button onclick='finalizarCompra("${producto.nombre}",${producto.precio}, "${producto._id}")' disabled class='finalizarCompra ${producto.estado.replace(' ', '-')}'><ons-icon icon='fa-shopping-cart'></ons-icon></ons-button>
            </div>
        </div>
        <div class='cantidadPrecio'>
            <div class='precioTotal'>
                Total: $<span>${totalPedido}</span>
            </div>
            <div class='cantidad'>
            <ons-button modifier='quiet' ${(producto.estado.indexOf('sin') != -1) ? ("disabled") : ("")} onclick='sumarCantidadProducto("resta", "${producto.precio}")'><i class="fa fa-minus" aria-hidden="true"></i></ons-button>
                <span class='cantTotal'>${cantidadUsuario}</span>
                <ons-button modifier='quiet' ${(producto.estado.indexOf('sin') != -1) ? ("disabled") : ("")} onclick='sumarCantidadProducto("suma", "${producto.precio}")'><i class="fa fa-plus" aria-hidden="true"></i></ons-button>
            </div>
        </div>
        <ons-list>
            <ons-list-header>Etiquetas</ons-list-header>     
        </ons-list>`);



        producto.etiquetas.forEach(function(etiqueta) {
            let nombreEtiqueta = etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1, etiqueta.length);
            $("#detalleProducto ons-list").append(`<ons-list-item>${nombreEtiqueta}</ons-list-item>`);
        });

        for (let index = 0; index < producto.puntaje; index++) {
            $("#detalleProducto .puntaje").append('<i class="fa fa-star" aria-hidden="true"></i>');
        }

        buscarFavoritoProducto(producto._id);



    }

}


function buscarFavoritoProducto(id) {
    // recorre lista de favoritos de local storage y si coincide devuelve la clase activeFav
    let favoritos = localStorage.getItem("Favoritos");
    let favJSON;
    if (favoritos != "") {
        favJSON = jQuery.parseJSON(favoritos);
    } else {
        favJSON = null;
    }

    if (favoritos) {

        let activoOk = false;

        for (let index = 0; index < favJSON.length && !activoOk; index++) {

            if (favJSON[index]._id == id && favJSON[index].usuario == usuarioLogueado._id) {
                activoOk = true;
                $(".iconoFav").addClass('activeFav');

            } else {
                $(".iconoFav").removeClass('activeFav');

            }

        }

    }

}


function sumarCantidadProducto(operacion, precioProducto) {
    cantidadUsuario = $(".cantTotal").html();
    if (operacion == 'suma') {
        if (cantidadUsuario == 0) {
            $(".precioTotal span").html(precioProducto);
            totalPedido = precioProducto;
        }
        cantidadUsuario++;
    } else if (operacion == 'resta') {
        cantidadUsuario--;
        if (cantidadUsuario <= 0) {
            $(".favs ons-button.en-stock").attr("disabled", "disabled");
            cantidadUsuario = 0;
        }
    }
    totalPedido = precioProducto * cantidadUsuario;
    if (totalPedido > 0) {
        $(".favs ons-button.en-stock").removeAttr("disabled");
    }
    $(".precioTotal span").html(totalPedido);
    $(".cantTotal").html(cantidadUsuario);

}

function finalizarCompra(nombre, precio, id) {
    //se arma objeto con la info de la compra
    const detalleCompra = {
        idProducto: id,
        nombreProducto: nombre,
        precioUnitario: precio,
        cantProducto: cantidadUsuario,
        precioTotal: totalPedido
    }
    navegar("finalizarCompra", false, false, detalleCompra)
}

//FAVORITOS
function guardarFavoritoHandler(productoFav) {
    let productoId = productoFav._id;


    let favoritosLocalStorage = window.localStorage.getItem("Favoritos");
    let favoritosJSON = null;
    let producto = productoFav;
    if (favoritosLocalStorage) {
        favoritosJSON = JSON.parse(favoritosLocalStorage);
        let i = 0;
        let encontrada = false;
        while (!encontrada && i < favoritosJSON.length) {
            let unFavorito = favoritosJSON[i];
            if (unFavorito._id === productoId && unFavorito.usuario === usuarioLogueado._id) {
                encontrada = true;
                $(".iconoFav").removeClass('activeFav');
                ons.notification.toast('Eliminado de favoritos', {
                    timeout: 1500,
                    animation: 'default'
                });
                // Elimino la receta del array de favoritos
                favoritosJSON.splice(i, 1);
            }
            i++;
        }
        // Si no encontré la receta entre los favoritos, la agrego.
        if (!encontrada) {
            if (producto) {
                producto.usuario = usuarioLogueado._id;
                favoritosJSON.push(producto);
                ons.notification.toast('Agregado a favoritos', {
                    timeout: 1500,
                    animation: 'default'
                });
                $(".iconoFav").addClass('activeFav');
            }
        }
    } else {
        // Si no tenía ningún favorito en localStorage, agrego la receta en cuestión.
        if (producto) {
            producto.usuario = usuarioLogueado._id;
            favoritosJSON = [producto];
            ons.notification.toast('Agregado a favoritos', {
                timeout: 1500,
                animation: 'default'
            });
            $(".iconoFav").addClass('activeFav');
        }
    }
    // Actualizo mis favoritos en el localStorage.
    localStorage.setItem("Favoritos", JSON.stringify(favoritosJSON));
}


/* Finalizar Compra */

function finalizarOnInit() {
    // consulta ajax para listar productos al inicio
    const detallesCompra = myNavigator.topPage.data;

    $.ajax({
        type: 'GET',
        url: urlBase + 'sucursales',
        headers: {
            "x-auth": tokenGuardado
        },
        contentType: "application/json",
        beforeSend: showLoadingModal,
        success: obtenerSucursales,
        complete: hideLoadingModal,
        error: errorCallback
    })

    function obtenerSucursales(sucursalesApi) {
        cargarPosicionDelUsuario(sucursalesApi, detallesCompra);
    }


}

function completarCompra(productos) {

    const datos = {
            cantidad: productos.cantProducto,
            idProducto: productos.idProducto,
            idSucursal: $("#selectSucursales option:selected").attr("id")
        }
        // consulta ajax POST para registrar la compra

    $.ajax({
        type: 'POST',
        url: urlBase + 'pedidos',
        headers: {
            "x-auth": tokenGuardado
        },
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(datos),
        beforeSend: showLoadingModal,
        success: altaCompra,
        complete: hideLoadingModal,
        error: errorCallback
    });


    function altaCompra(datos) {
        if (datos.data.length == undefined) {
            $("#comprarBtn").attr("disabled", "disabled");
            ons.notification.toast('Compra realizada!', {
                timeout: 1500,
                animation: 'default'
            });
            navegar('tabbarHome', true, true);
        } else {
            //enviar mensaje de error
        }
    }

}

/* PEDIDOS */

// consulta ajax para obtener pedidos

function pedidosOnShow() {
    $.ajax({
        type: 'GET',
        url: urlBase + 'pedidos',
        headers: {
            "x-auth": tokenGuardado
        },
        contentType: "application/json",
        beforeSend: showLoadingModal,
        success: pedidosDetalles,
        complete: hideLoadingModal,
        error: errorCallback
    })
}

function pedidosDetalles(detallePedido) {
    let datos = detallePedido.data;
    if (datos.length == 0) {
        $("#pedidos .listaPedidos").html("<p class='container'>No hay pedidos realizados.</p>")
    } else {
        listarPedidos(datos);
    }
}

function listarPedidos(dataPedidos) {
    listaPedidosHtml = "";

    dataPedidos.forEach(function(pedido) {
        let pedidoData = {
            _id: pedido._id,
            total: pedido.total,
            cantidad: pedido.cantidad,
            fecha: pedido.fecha,
            estado: pedido.estado,
            comentario: pedido.comentario,
            producto: pedido.producto,
            sucursal: pedido.sucursal
        }

        let pedidoJSON = JSON.stringify(pedidoData);


        listaPedidosHtml += `
    <ons-list-item class='${pedido._id}' modifier='chevron' tappable onclick='navegar("comentarios", false, false, ${pedidoJSON})'>
        <div class='left'>
        
        <img class='list-item__thumbnail' src=${urlImg + pedido.producto.urlImagen}.jpg>
        </div>
        <div class='center'>
          <span class="sucursalPedido">${pedido.sucursal.nombre}, ${pedido.sucursal.ciudad}</span>
            <span class='list-item__title'>
            <span class="cantidad">${pedido.cantidad}</span>
            <span class="nombre">${pedido.producto.nombre}</span>
            <div class="detallesPedido">
                <div class="fechaEstado">

                    <div class="fechaPedido">
                        <span class="fechaLabel">REALIZADO EL</span>
                        <span class="fecha">${formatearFecha(pedido.fecha)}</span>
                    </div>
                    
                    <span class='list-item__subtitle'>
                        <span class="estado">Estado:</span>
                        <span class="estado${pedido.estado}">${pedido.estado}</span>
                    </span>

                </div>

                <span class="precio">$ ${pedido.total}</span>
            </div>
        </div>
        <div class='right'>
        
        </div>
        </ons-list-item>    
    `

    });
    $("#pedidos .listaPedidos").html(listaPedidosHtml);
}

function formatearFecha(fecha) {
    let timeFormat = new Date(fecha);
    let d = timeFormat.getDate();
    let m = timeFormat.getMonth();
    m += 1; // JavaScript months are 0-11
    let y = timeFormat.getFullYear();

    let fechaFinal = d + "/" + m + "/" + y;

    return fechaFinal;
}

/* COMENTARIOS */

function comentariosOnShow() {
    let datos = myNavigator.topPage.data;
    let comentarioHtml = "";

    if (datos) {
        comentarioHtml += `
        <span>Fecha de Pedido:${formatearFecha(datos.fecha)}</span>
        <span>${datos.cantidad}x ${datos.producto.nombre}</span>
        <span>Sucursal: ${datos.sucursal.direccion}</span>
        <span>Precio Total: $${datos.total}</span>
    
        <ons-input id="txtComentario" modifier="underbar" type="textarea" placeholder="Ingrese sus comentarios..." value='${(datos.comentario == undefined) ? ("") : (datos.comentario)}'></ons-input>
        <ons-button id="btnComentario" onclick='comentarAjax("${datos._id}")' disabled>Enviar comentario</ons-button>
        `
    }

    $("#detalleComentario").html(comentarioHtml);

    if (datos.comentario != undefined) {
        $("#txtComentario").attr("disabled", "disabled");
        $("#txtComentario").removeAttr('placeholder');
    } else {
        $("#txtComentario").removeAttr('disabled');
        $("#txtComentario").attr('placeholder', 'Ingrese sus comentarios...');
    };

    $("#txtComentario").keyup(function() {
        if (this.value != "") {
            $("#btnComentario").removeAttr('disabled')
        } else {
            $("#txtComentario").removeAttr('placeholder');
            $("#btnComentario").attr('disabled', 'disabled')
        }

    });
}

function comentarAjax(datoId) {

    let coment = document.querySelector('ons-input').value;
    const comentario = {
        comentario: coment
    }

    $.ajax({
        type: 'PUT',
        url: urlBase + 'pedidos/' + datoId,
        headers: {
            "x-auth": tokenGuardado
        },
        contentType: "application/json",
        data: JSON.stringify(comentario),
        beforeSend: showLoadingModal,
        success: enviarComentario,
        complete: hideLoadingModal,
        error: errorCallback
    })

    function enviarComentario(data) {
        if (data.error == "") {
            volver();
            ons.notification.toast('Comentario enviado con éxito.', {
                timeout: 1500,
                animation: 'default'
            });
        }
    }
}



/* Funciones de Mapa */

function inicializarMapa() {
    miMapa = L.map('contenedorDeMapa').setView([posicionDelUsuario.latitude, posicionDelUsuario.longitude], 15);

    L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWNhaWFmYSIsImEiOiJjanh4cThybXgwMjl6M2RvemNjNjI1MDJ5In0.BKUxkp2V210uiAM4Pd2YWw", {
            id: "mapbox/streets-v11",
            accessToken: "your.mapbox.access.token"
        }
    ).addTo(miMapa);
}

function cargarPosicionDelUsuario(sucursalesApi, detallesCompra) {
    window.navigator.geolocation.getCurrentPosition(function(pos) {
        posicionDelUsuario = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
        };
        inicializarMapa();
        dibujarPosicion([posicionDelUsuario.latitude, posicionDelUsuario.longitude]);


    }, function() {
        posicionDelUsuario = {
            latitude: -34.903816878014354,
            longitude: -56.19059048108193
        };
    });

    //dibuja posicion
    let sucursales = sucursalesApi.data;
    $(".infoCompra").html(`<span class='nombre'>${detallesCompra.cantProducto}x ${detallesCompra.nombreProducto}</span>

    <span class='unitario'> Precio unitario: <span>$${detallesCompra.precioUnitario}</span></span>
    <span class='total'> Total: <span>$${detallesCompra.precioTotal}</span></span>

    <div class='elegirSucursal'>
     
    </div>
    <ons-button id='comprarBtn' disabled modifier='large' onclick='completarCompra(${JSON.stringify(detallesCompra)})'>Comprar</ons-button>
    <div id='contenedorDeMapa'></div>`);
    //creo el select de sucursales
    $(".elegirSucursal").html(`<ons-select id='selectSucursales' onchange='cargarSucursalMapa(event)'></ons-select>`);
    //relleno el select
    $("#selectSucursales").append(`<option value=''>-- Elegir Sucursal --</option>`);


    sucursales.forEach(function(sucursal) {
        $("#selectSucursales").append(`<option id='${sucursal._id}' value='${sucursal.direccion}, ${sucursal.nombre}'>${sucursal.direccion}, ${sucursal.nombre}</option>`)
    });

}

function dibujarPosicion(latLon) {
    let marker = L.marker(latLon);

    marker.addTo(miMapa);

    miMapa.panTo(new L.LatLng(posicionDelUsuario.latitude, posicionDelUsuario.longitude), { animate: true, duration: 5 });
}

function cargarSucursalMapa(event) {
    if (event.target.value != '') {
        $("#comprarBtn").removeAttr("disabled");
    } else {
        $("#comprarBtn").attr("disabled", "disabled")
    }
    let direccionBusqueda = '';
    if (event.target.value != '') {
        direccionBusqueda = event.target.value;
    };
    $.ajax({
        type: "GET",
        url: `https://nominatim.openstreetmap.org/search?format=json&q=${direccionBusqueda}, Uruguay`,
        success: function(data) {
            dibujarPosicion([data[0].lat, data[0].lon]);
            dibujarDistancia([data[0].lat, data[0].lon], [posicionDelUsuario.latitude, posicionDelUsuario.longitude])
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function dibujarDistancia(latLon1, latLon2) {
    const puntosLinea = [latLon1, latLon2];

    const distancia = Number((miMapa.distance(latLon1, latLon2) / 1000)).toFixed(2);

    const polyline = L.polyline(puntosLinea, { color: 'yellow' }).addTo(miMapa).bindPopup(`Distancia: ${distancia} km.`);

    miMapa.fitBounds(polyline.getBounds());
}

/* Escaneo QR */

// Función que se dispara al ingresar a la página de escaneo.
function escanearOnInit() {
    QRScanner.prepare(prepareCallback);
    // Si hay scanner
    if (window.QRScanner) {
        // Esto lo uso para mostrar la cam en la app.
        // Por defecto la vista previa queda por encima del body y el html.
        // Pero por un tema de compatibilidad con Onsen, queda por debajo de la page.
        // Mirar el css y ver cómo hay que hacer que esta page sea transparente para que se vea la cámara.
        window.QRScanner.show(
            function(status) {
                // Función de scan y su callback
                window.QRScanner.scan(scanCallback);
            }
        );
    }
}

function scanCallback(err, text) {
    if (err) {
        // Ocurrió un error o el escaneo fue cancelado(error code '6').
        ons.notification.alert(JSON.stringify(err));
    } else {
        // Si no hay error escondo el callback y vuelvo a la pantalla anterior pasando el string que se escaneó con la url del producto.
        QRScanner.hide();
        myNavigator.popPage({ data: { scanText: text } });
    }
}

/* Favoritos */

function favoritosOnShow() {
    let listaFavs = localStorage.getItem('Favoritos');
    let listaFavsJSON = jQuery.parseJSON(listaFavs);


    favsUsuario.data = [];
    favsUsuario.length = 0;

    listaFavsJSON.forEach(function(favorito) {
        if (favorito.usuario == usuarioLogueado._id) {
            favsUsuario.data.push(favorito);
        }
    })


    if (favsUsuario.data.length == 0) {
        $(".listaFavoritos").html("<p class='container' id='mensajeFavoritos'>No hay favoritos guardados.</p>")
    } else {
        listarFavoritos(favsUsuario);
    }

}

function listarFavoritos(favsUsuario) {
    listaFavsHtml = "";
    favsUsuario.data.forEach(function(favorito) {
        if (favorito.usuario == usuarioLogueado._id) {
            listaFavsHtml += `<ons-list-item class='${favorito._id}'>
        <div class='left'>
        <img class='list-item__thumbnail' src=${urlImg + favorito.urlImagen}.jpg>
        </div>
        <div class='center'>
            <span class='list-item__title'>
            <span class="nombre">${favorito.nombre}</span>
                <div class="precioFavs">
                    <span class="precio">$${favorito.precio}</span>
                </div>
            </span>
            <span class='list-item__subtitle'>
              <span class="codigo">${favorito.codigo}</span>
              <span class="estado ${favorito.estado.replace(' ', '-')}">${favorito.estado}</span>
            
            </span>
        </div>
        <div class='right'>
          <ons-button class="eliminarFav" modifier="quiet" id="${favorito._id}" onclick='eliminarProducto("${favorito._id}")'>
            <i class="fa fa-minus" aria-hidden="true"></i>
          </ons-button>
        </div>
        </ons-list-item>`;
        }

    });
    $(".listaFavoritos").html(listaFavsHtml);
    if (listaFavsHtml == "") {
        $(".listaFavoritos").html("<p class='container' id='mensajeFavoritos'>No hay favoritos guardados.</p>");
    }
}



function eliminarProducto(productoFav) {
    let productoId = productoFav;
    let favoritosLocalStorage = localStorage.getItem("Favoritos");
    let favoritosJSON = [];
    favoritosJSON.data = [];
    if (favoritosLocalStorage) {
        favoritosJSON.data = JSON.parse(favoritosLocalStorage);
        let i = 0;
        let encontrada = false;
        while (!encontrada && i < favoritosJSON.data.length) {
            let unFavorito = favoritosJSON.data[i];
            if (unFavorito._id === productoId && unFavorito.usuario === usuarioLogueado._id) {
                encontrada = true;
                ons.notification.toast('Eliminado de favoritos', {
                    timeout: 1500,
                    animation: 'default'
                });
                // Elimino la receta del array de favoritos
                favoritosJSON.data.splice(i, 1);
            }
            i++;
        }

        localStorage.setItem("Favoritos", JSON.stringify(favoritosJSON.data));
        listarFavoritos(favoritosJSON);

    }



}
/* Generales */
function errorCallback(resp) {
    hideLoadingModal();
    if (resp.status === 401) {
        ons.notification.alert("Usuario no autorizado");
    } else {
        ons.notification.alert(resp.responseJSON.error);
    }
}

function hideLoadingModal() {
    spinnerModal.hide();
}

function showLoadingModal() {
    spinnerModal.show();
}

// Función para abrir el menú.

function abrirMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .open() no es de jQuery.
    document.querySelector("#menu").open();
}

// Función para cerrar el menú.
function cerrarMenu() {
    // No puedo seleccionar el elemento con $("#menu") porque la función .close() no es de jQuery.
    document.querySelector("#menu").close();
}


// Función para chequear el estado de la conexión.

document.addEventListener('offline', function() {
    ons.notification.toast('Sin conexión', {
        timeout: 1500,
        animation: 'default'
    });
    myNavigator.pushPage('error.html');
    /*  navegar('error', false, true); */
}, false);

document.addEventListener('online', function online() {
    ons.notification.toast('Volvio la conexión', {
        timeout: 1500,
        animation: 'default'
    });
    myNavigator.popPage();
    /* volver ();*/
}, false);

//Funciones para validar campos en login y registro

function validarCampo(campo) {
    return (campo.length >= 2);
}

function validarEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

function validarPass(pass) {
    return (pass.length >= 8);
}