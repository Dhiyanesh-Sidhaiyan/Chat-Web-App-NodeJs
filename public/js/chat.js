const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templates

const messageTemplate = document.querySelector("#message-template").innerHTML;
const urlTemplate = document.querySelector("#url-template").innerHTML;
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }); // QS is mentioned in html script//ignore queryprefix is used to remove ? in query

//autoscroll

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.emit('join', { username, room },(error)=>{
    if (error){
        alert(error);
        location.href ='/';
    }
});

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username:message.message,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (msg) => {

    const html = Mustache.render(urlTemplate, {
        username : msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});


socket.on('roomData',({users , room } ={})=>{
    console.log(room)
    console.log(users)

    const html = Mustache.render(sideBarTemplate,{
        room,
        users
    });

    document.querySelector("#sidebar").innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const textContent = e.target.elements.message.value;

    //disable button 

    $messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', textContent, (error) => {

        //Enable button and clear input text box, cursor focus on box.
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return alert("Error: " + error);
        }

        console.log("The Message was delivered to server");
    });
});

$sendLocationButton.addEventListener('click', (e) => {
    // console.log(e);

    if (!navigator.geolocation) {
        alert("Unable to fetch location. Try later");
    }


    $sendLocationButton.setAttribute('disabled', "disabled");

    navigator.geolocation.getCurrentPosition((geo) => {
        socket.emit("sendLocation", {
            latitude: geo.coords.latitude,
            longitude: geo.coords.longitude
        }, (msg) => {
            $sendLocationButton.removeAttribute('disabled');
            console.log("Location shared to server successfuly");
        });
    });
});


