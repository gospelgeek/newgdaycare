const room_mail = Session.getActiveUser().getEmail();
const hoja_Mails = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MAILS");

//DECLARO LA SEDE DEL DAYCARE y TOMO EL FOLDER CORRESPONDIENTE
const room_actve = get_room();
const ng_active = room_actve.substring(0,3);
let fila_ng_active = hoja_Mails.getRange("E:E").createTextFinder(ng_active).findAll()[0].getRow();
let id_ng_active = hoja_Mails.getRange("F"+fila_ng_active).getValue();
const folder_daily_reports = DriveApp.getFolderById(id_ng_active); // Obtenemos el folder por su ID

//TOMO LA HOJA CON LA INFORMACIÓN DEL DAYCARE CORRESPONDIENTE Y LA ORDENO y GENERO EL ARREGLO CON LA INFORMACIÓN DE LOS CHICOS
const hoja_Kids = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DATA "+ng_active);
hoja_Kids.getRange(2, 1, hoja_Kids.getLastRow() - 1, hoja_Kids.getLastColumn()).sort({column: 6, ascending: true});
//var kids_full_list = get_full_kids_List();

//TOMO LA HOJA CON LA INFORMACIÓN DE LOS PROFES
const hoja_Staff = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("STAFF");

//OBTENGO ARCHIVO MATRIZ
const plantilla_daily = DriveApp.getFileById("1SGwCchNciFwOD2L8vNAlEmL-USO2r5mKlVAnT9l46eM");
//var archivo_diario;

function doGet() {
//  Utilities.setTimeZone("GMT-4");
  verificar_archivo_diario();
  return HtmlService.createHtmlOutputFromFile('Index');
}


// OBTENGO EL SALÓN QUE CORRESPONDE A LA CUENTA QUE SE ENCUENTRA LOGUEADA EN LA TABLETA
function get_room(){
 const hoja_Mails_i = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MAILS");
  let id_fila  = hoja_Mails_i.createTextFinder( Session.getActiveUser().getEmail() ).findAll()[0].getRow();
  if (id_fila > 0 )
    return hoja_Mails.getRange('A'+id_fila).getValue();
  else
    return false;
}


//CARGO EL LISTADO DE LOS NOMBRE DE LOS SALONES
function get_rooms_list(){
  let list_rooms = [];
  let rango = hoja_Mails.getDataRange();
  let valores = rango.getValues();
  for (i=0; i<valores.length; i++){
    let room_i = valores[i][0];
    if (room_i.substring(0,3) == ng_active){
      Logger.log(room_i + " - i:"+i);
      if ( room_i == get_room() )
        room_i += "*";
      list_rooms.push(room_i);
    }
  }
  return list_rooms;
}


//CREO LA CADENA PARA LOS NOMBRES DE LOS SALONES
function get_rooms_html(){
  let salones_html = "";
  let div_salon = "";
  let rango = hoja_Mails.getDataRange();
  let valores = rango.getValues();

  for (i=1; i<valores.length; i++){
    let room_i = valores[i][0];
    if (room_i.substring(0,3) == ng_active){
      if ( room_i == get_room() ){
        div_salon = '<div id="' + room_i + '" class="salones active"><h2 class="room">' + room_i + '</h2></div>';
        Logger.log(room_i);
      }
      else{
        div_salon = '<div id="' + room_i + '" class="salones"><h2 class="room">' + room_i + '</h2></div>';  
      }
      salones_html += div_salon;
    }
  }
  return salones_html;
}


//ENTREGA EL LISTADO DE LOS NIÑOS DE UN SALÓN
function get_list_room_active(){
  room = room_actve;
  var listado = [];
  var ids_filas  = hoja_Kids.createTextFinder(room).findAll();
  if (ids_filas.length > 0){
    for (i=0; i<ids_filas.length; i++){
        var id_fila = ids_filas[i].getRow();
        var name_kid_i = hoja_Kids.getRange('CW'+id_fila).getValue();
        var id_kid_i = hoja_Kids.getRange('D'+id_fila).getValue();
        var pic_kid_i = hoja_Kids.getRange('CV'+id_fila).getValue();
        var room_kid_i = hoja_Kids.getRange('F'+id_fila).getValue();
        var abc_kid_i = hoja_Kids.getRange('CQ'+id_fila).getValue() ? hoja_Kids.getRange('CQ'+id_fila).getValue() : false;
        var kid =  '{"id":"'+id_kid_i+'","name":"'+name_kid_i+'","pic":"'+pic_kid_i+'","room":"'+room_kid_i+'","abc":'+abc_kid_i+'}';
        kid = JSON.parse(kid);
        listado.push(kid);
      }
    return listado;
  }else{
    return false;
  }
}


//ENTREGO TODA LA LISTA DE TODOS LOS NIÑOS DEL DAYCARE ACTIVO
function get_full_kids_List(){

  let file_archivo_diario = verificar_archivo_diario();
  let archivo_diario = SpreadsheetApp.open(file_archivo_diario)  
  let hoja_attendance = archivo_diario.getSheetByName("attendance");
  let rango_att = hoja_attendance.getDataRange();
  let valores_attendance = rango_att.getValues();

  listado = [];
  var rango = hoja_Kids.getDataRange();
  var valores = rango.getValues();

  for (i=1; i<valores.length; i++){
      let name_kid_i = valores[i][100];
      let id_kid_i = valores[i][3];
      let pic_kid_i = (valores[i][99] == "#N/A") ? "https://newgdaycare.com/wp-content/uploads/2023/03/generic.png" : valores[i][99];
      let room_kid_i = valores[i][5];
      let abc_kid_i = (valores[i][94]) ? valores[i][94] : false;
      let alredy_kid_i = (valores_attendance[i+1][4]) ? valores_attendance[i+1][4] : "";
      let alredy_kid_att = (valores_attendance[i+1][4]) ? valores_attendance[i+1][4] : "";
      let kid =  '{"id":"'+id_kid_i+'","name":"'+name_kid_i+'","pic":"'+pic_kid_i+'","room":"'+room_kid_i+'","abc":'+abc_kid_i+',"alredy":"'+ alredy_kid_i +'","att":"'+ alredy_kid_att +'"}';
      kid = JSON.parse(kid);
      listado.push(kid);
    }
    console.log(listado);
    return listado;
}


// VERIFICAR - CREAR ARCHIVO DIARIO
function verificar_archivo_diario(){
  let fecha = new Date();
  let day = fecha.getDay();
day= 5;
  if (day < 6){
    var mes = fecha.getMonth() + 1; 
    mes = mes < 10 ? '0' + mes : mes;
    var dia = fecha.getDate();
    var anio = fecha.getFullYear();
    var fechaActual = mes + '-' + dia + '-' + anio;
    var name_daily_file = ng_active+" Name to Face Attendance - "+fechaActual;

    var archivos = folder_daily_reports.searchFiles("title='" + name_daily_file + "'");

    if (archivos.hasNext()) {
      return archivo_diario = archivos.next();
    }else{
      archivo_diario = plantilla_daily.makeCopy(name_daily_file, folder_daily_reports);
      poblar_archivo_daily(archivo_diario);
    } 
  }
}

//////////////////////////////////////////////// ACCIONES DESPUES DE QUE EL USUARIO INTERVENGA

// POBLAR ARCHIVO
function poblar_archivo_daily(archivo){
  hoja = SpreadsheetApp.open(archivo);
  var attendance = hoja.getSheetByName("attendance");

  let fecha = attendance.getRange("O1").setValue(Date());

  var fila_registro = 3;
  listado = get_full_kids_List();
  listado.forEach(function(kid) {
      attendance.getRange("A"+fila_registro).setValue(kid.id);
      attendance.getRange("B"+fila_registro).setValue(kid.name);
      attendance.getRange("C"+fila_registro).setValue(kid.abc);
      attendance.getRange("D"+fila_registro).setValue(kid.room);
      fila_registro++;
    });
}


//OBTENER LISTADO DE PROFESORES
function lista_profes(){
  let profes_html = "";
  let rango = hoja_Staff.getDataRange();
  let valores = rango.getValues();
  for (i=1; i<valores.length; i++){
    let name_teacher_i = valores[i][0] +" "+ valores[i][1];
    let sede_i = valores[i][3];    let active_i = valores[i][2];
    if (sede_i == ng_active && active_i == "A")
      profes_html += '<option value="' + name_teacher_i + '">' + name_teacher_i + '</option>';
  }
  return profes_html;
}


//GUARDO LA ASISTENCIA DE UN NIÑO
function guardar_oneKid(kid, hoja_attendance){
//kid = {'id':"NG1-263", 'hour':"10", "attendance":"X", 'teacher': "Samuel", 'time':"Check-In: 14:57"};
  let fila_kid = hoja_attendance.createTextFinder(kid.id).findAll()[0].getRow();
  fila_kid = parseInt(fila_kid);
  Logger.log(fila_kid);
  hoja_attendance.getRange(fila_kid, kid.hour).setValue(kid.attendance).setNote("Checked by: "+kid.teacher);
  let check_time = kid.time.substring(6,8);
  let time_check = kid.time.substring( kid.time.length - 5 );
  (check_time == "In") ? hoja_attendance.getRange(fila_kid, 5).setValue(time_check) : hoja_attendance.getRange(fila_kid, 23).setValue(time_check); 
  Logger.log(check_time);
}


//TOMO LA INFORMACIÓN QUE ESTÁ EN LA PÁGINA
function procesar_asistencia(arreglo_kids){
  let file_archivo_diario = verificar_archivo_diario();
  let archivo_diario = SpreadsheetApp.open(file_archivo_diario)  
  let hoja_attendance = archivo_diario.getSheetByName("attendance");

  arreglo_kids.forEach(function(kid){
    guardar_oneKid(kid, hoja_attendance);
  })
}


function myFunction() {

}

