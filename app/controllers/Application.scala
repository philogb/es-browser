package controllers

import play.api._
import play.api.mvc._
import api.sql._
import com.codahale.jerkson.Json

object Application extends Controller {

  def index = Action { request =>
    render(request)
  }

  def timeSeries = Action { request =>
    val jsonThread = Json.generate[Map[String, Any]](
        Sql.getGroupedMessages
    )
    Ok(jsonThread)
  }

  def getMessage(id: String) = Action { request =>
    val jsonThread = Json.generate[Message](
        Sql.getMessageById(id)
    )
    Ok(jsonThread)
  }

  def searchMessages(text: String) = Action { request =>
    val jsonThread = Json.generate[Map[String, Any]](
        Sql.searchMessages(text)
    )
    Ok(jsonThread)
  }

  def render(request: Request[AnyContent], args: (Symbol, Any)*) = {
    val template = request.path.replace(".", "/")
    val default = if (template.size == 0 || template == "/") "/index" else template
    Ok(ScalateTemplate(default).render(args: _*)).as(HTML)
  }
}