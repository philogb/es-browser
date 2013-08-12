package api.sql

import scala.io.Source.fromFile
import anorm._
import play.api.Play.current
import play.api.db.DB

case class Message(message_id: String, 
                   in_reply_to: String, 
                   subject: String, 
                   date: String, 
                   author: String, 
                   body: String, 
                   references: String) 

case class Thread(subject: String, 
                  from: String, 
                  to: String, 
                  messages: List[Message])

object Sql {

  def getGroupedMessages: Map[String, Any] = {
    DB.withConnection { implicit c =>
      val mList = SQL("SELECT message_id, in_reply_to, subject, date, author FROM messages")().map { m =>
        Message(
            m[String]("message_id"),
            m[Option[String]]("in_reply_to").getOrElse(null),
            m[String]("subject"),
            m[java.util.Date]("date").toString,
            m[String]("author"),
            "",
            "")
      }.toList
      val group = mList.groupBy { case Message(_, _, _, date, _, _, _) =>
        date.substring(0, 10)
      }
      val authors = mList.groupBy { case Message(_, _, _, _, author, _, _) =>
        author
      }.collect { case (k: String, v: List[Message]) =>
        (k -> v.size)
      }
      Map(
          "count" -> mList.size,
          "authors" -> authors,
          "group" -> group
      )
    }
  }
  
  def getMessageById(id: String): Message = {
    DB.withConnection { implicit c =>
      SQL("SELECT * FROM messages WHERE message_id = {id}").on('id -> id)().map { m =>
        Message(
            m[String]("message_id"),
            m[Option[String]]("in_reply_to").getOrElse(null),
            m[String]("subject"),
            m[java.util.Date]("date").toString,
            m[String]("author"),
            m[String]("body"),
            "")
      }.toList.head
    }
  }
  
  def searchMessages(terms: String): Map[String, Any] = {
    DB.withConnection { implicit c =>
      val searchQuery = "%" + terms + "%"
      val results = SQL("SELECT * FROM messages WHERE subject like {subject} OR body like {body} ORDER BY date ASC")
        .on('subject -> searchQuery, 'body -> searchQuery)()
        .map { m =>
        Message(
            m[String]("message_id"),
            m[Option[String]]("in_reply_to").getOrElse(null),
            m[String]("subject"),
            m[java.util.Date]("date").toString,
            m[String]("author"),
            m[String]("body"),
            "")
      }.toList
      val threads = results.groupBy { case Message(_, _, subject, _, _, _, _) => 
        subject
      }.collect { case (subject: String, v: List[Message]) =>
        val Message(_, _, _, minDate, _, _, _) = v.head
        val Message(_, _, _, maxDate, _, _, _) = v.last
        Thread(subject, minDate, maxDate, v)
      }
      val authors = results.groupBy { case Message(_, _, _, _, author, _, _) =>
        author
      }.collect { case (k: String, v: List[Message]) =>
        (k -> v.size)
      }
      Map(
          "count" -> results.size,
          "threads" -> threads,
          "authors" -> authors 
      )
    }
  }
}