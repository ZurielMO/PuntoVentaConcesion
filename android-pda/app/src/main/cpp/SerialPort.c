#include <fcntl.h>
#include <jni.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

static speed_t baud_to_speed(jint baudrate) {
    switch (baudrate) {
        case 2400: return B2400;
        case 4800: return B4800;
        case 9600: return B9600;
        case 19200: return B19200;
        case 38400: return B38400;
        case 57600: return B57600;
        case 115200: return B115200;
        case 230400: return B230400;
        default: return B115200;
    }
}

JNIEXPORT jint JNICALL
Java_mx_clubleon_vippda_serial_SerialPort_nativeOpen(
        JNIEnv *env,
        jobject thiz,
        jstring path,
        jint baudrate,
        jint flags) {
    const char *path_utf = (*env)->GetStringUTFChars(env, path, NULL);
    if (path_utf == NULL) {
        return -1;
    }

    int fd = open(path_utf, O_RDWR | O_NOCTTY | O_SYNC | flags);
    (*env)->ReleaseStringUTFChars(env, path, path_utf);
    if (fd < 0) {
        return -1;
    }

    struct termios cfg;
    if (tcgetattr(fd, &cfg) == 0) {
        cfmakeraw(&cfg);
        speed_t speed = baud_to_speed(baudrate);
        cfsetispeed(&cfg, speed);
        cfsetospeed(&cfg, speed);
        cfg.c_cflag |= (CLOCAL | CREAD);
        cfg.c_cflag &= ~CRTSCTS;
        tcsetattr(fd, TCSANOW, &cfg);
        tcflush(fd, TCIOFLUSH);
    }

    return fd;
}

JNIEXPORT void JNICALL
Java_mx_clubleon_vippda_serial_SerialPort_nativeClose(
        JNIEnv *env,
        jobject thiz,
        jint fd) {
    if (fd >= 0) {
        close(fd);
    }
}
