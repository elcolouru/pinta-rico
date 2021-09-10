class Usuario {
    constructor(
        pId,
        pNombre,
        pApellido,
        pEmail,
        pDireccion,
        pPassword
    ) {
        this._id = pId;
        this.nombre = pNombre;
        this.apellido = pApellido;
        this.email = pEmail;
        this.direccion = pDireccion;
        this.password = pPassword;
    }
}

class Producto {
    constructor(
        pId,
        pNombre,
        pEtiquetas,
        pPrecio,
        pEstado,
        pUrlImg,
        pCodigo,
        pPuntaje
    ) {
        this._id = pId;
        this.nombre = pNombre;
        this.etiquetas = pEtiquetas;
        this.precio = pPrecio;
        this.estado = pEstado;
        this.urlImg = pUrlImg;
        this.codigo = pCodigo;
        this.puntaje = pPuntaje;
    }
}