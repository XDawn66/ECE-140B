document.addEventListener("DOMContentLoaded", deviceLoad);

function deviceLoad(event) {
  event.preventDefault();

  fetch(`devices/look`)
    .then(response => response.json())
    .then((data) => {
      let i;
      for (i = 0; i < data.length; i++) {
        const device_container = document.getElementById("device_list");
        const devices = device_container.getElementsByTagName("li");
        const device = document.createElement("li");
        device.textContent = data[i]['name'];
        device.id = `device_${devices.length + 1}`;
        device_container.appendChild(device);
        
        const rename_container = document.getElementById("rename_buttons");
        const rename_holder = document.createElement("li");
        const renameBtn = document.createElement("button");
        renameBtn.textContent = "Rename";
        renameBtn.id = "rename_btn";
        renameBtn.addEventListener("click", function () {
          let newName = prompt("Enter new device name:");
          if (newName) {
            let target_device = document.getElementById(device.id);
            fetch(`devices/${target_device.innerHTML}/${newName}`, {
                method: "POST"
            })
            target_device.textContent = newName;
          }
        });
        rename_container.appendChild(rename_holder);
        rename_holder.appendChild(renameBtn);
      }
    });
}

document.getElementById("add_device").addEventListener("click", function () {
    let id_input = document.getElementById("iot_id_add");
    let id = id_input.value;
    if (!id) {
      alert("Please enter a device ID");
      return;
    }
    const device_container = document.getElementById("device_list");
    let devices = device_container.getElementsByTagName("li");
    if (devices.length > 4) {
      alert("You can only add 5 devices to the list");
      return;
    }
    let device = document.createElement("li");
    device.textContent = id;
    device.id = `device_${devices.length + 1}`;
    device_container.appendChild(device);
    
    fetch(`devices/${id}`, {
        method: "PUT"
    })

    let rename_container = document.getElementById("rename_buttons");
    let rename_holder = document.createElement("li");
    let renameBtn = document.createElement("button");
    renameBtn.textContent = "Rename";
    renameBtn.id = "rename_btn";
    renameBtn.addEventListener("click", function () {
      let newName = prompt("Enter new device name:");
      if (newName) {
        let target_device = document.getElementById(device.id);
        fetch(`devices/${target_device.innerHTML}/${newName}`, {
            method: "POST"
        })
        target_device.textContent = newName;
      }
    });
    rename_container.appendChild(rename_holder);
    rename_holder.appendChild(renameBtn);
    id_input.value = "";
  });
  
  document.getElementById("remove_device").addEventListener("click", function () {
    let id_input = document.getElementById("iot_id_remove");
    let id = id_input.value;
    if (!id) {
      alert("Please enter a device ID");
    }
    const device_container = document.getElementById("device_list");
    let devices = device_container.getElementsByTagName("li");
    if (devices.length == 0) {
      alert("No devices to remove");
      return;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices[i].textContent == id) {
        device_container.removeChild(devices[i]);
        const rename_container = document.getElementById("rename_buttons");
        let rename_buttons = rename_container.getElementsByTagName("li");
        rename_container.removeChild(rename_buttons[i]);
        id_input.value = "";
        fetch(`devices/${id}`, {
            method: "DELETE"
        })
        return;
      }
      alert("Device not found");
      id_input.value = "";
    }
  });