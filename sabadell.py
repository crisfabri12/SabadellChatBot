
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "http://localhost:5173"}})

# Configurar la clave de API de OpenAI
client = OpenAI(api_key="")

# ID del asistente preexistente
assistant_id = "asst_xNSrXJ1z84W4Vc6Ipq3rZnY5"

# Almacenamiento en memoria para los hilos de cada usuario
user_threads = {}

@app.route("/create_chat", methods=["POST"])
def create_chat():
    # Obtener el identificador único del usuario desde la solicitud
    user_id = request.json.get("user_id")

    # Verificar si ya existe un hilo para este usuario
    if user_id in user_threads:
        return jsonify({"message": "El chat ya existe para este usuario."}), 400

    # Crear un nuevo hilo de conversación para el usuario
    thread = client.beta.threads.create()

    # Almacenar el hilo en el diccionario
    user_threads[user_id] = {
        "thread_id": thread.id
    }

    return jsonify({
        "message": "Chat creado exitosamente.",
        "thread_id": thread.id
    })

@app.route("/send_message", methods=["POST"])
def send_message():
    # Obtener el identificador del usuario, el mensaje y el ID del hilo
    user_id = request.json.get("user_id")
    user_message = request.json.get("message")

    # Verificar si existe un hilo para este usuario
    if user_id not in user_threads:
        return jsonify({"error": "Chat no encontrado. Por favor, crea un chat primero."}), 404

    # Recuperar el ID del hilo
    thread_id = user_threads[user_id]["thread_id"]

    # Agregar el mensaje del usuario al hilo
    message = client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=user_message,
    )

    # Crear la ejecución del hilo con el asistente preexistente
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant_id
    )

    # Verificar el estado de la ejecución hasta que esté completada
    while run.status != "completed":
        run_status = client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id
        )
        if run_status.status == "completed":
            break

    # Recuperar los mensajes del hilo
    all_messages = client.beta.threads.messages.list(
        thread_id=thread_id
    )

    # Obtener la respuesta del asistente y convertirla a un tipo serializable
    assistant_message = ""
    for msg in all_messages.data:
        if msg.role == 'assistant':
            assistant_message = str(msg.content[0].text.value)
            break

    # Devolver la respuesta al cliente
    return jsonify({"user_message": user_message, "assistant_message": assistant_message})

@app.route("/get_messages/<user_id>", methods=["GET"])
def get_messages(user_id):
    # Verificar si existe un hilo para este usuario
    if user_id not in user_threads:
        return jsonify({"error": "Chat no encontrado para este usuario."}), 404

    # Recuperar el thread_id asociado al usuario
    thread_id = user_threads[user_id]["thread_id"]

    try:
        # Recuperar los mensajes del hilo especificado
        messages = client.beta.threads.messages.list(
            thread_id=thread_id,
            limit=100,  # Puedes ajustar este valor según tus necesidades
            order="desc"  # Cambiar a "asc" si deseas los mensajes en orden ascendente
        )

        # Formatear los mensajes para que sean más legibles
        formatted_messages = []
        for msg in messages.data:
            formatted_messages.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content[0].text.value if msg.content else "",
                "created_at": msg.created_at
            })

        return jsonify({"messages": formatted_messages}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)

